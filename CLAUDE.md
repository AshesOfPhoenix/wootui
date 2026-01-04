# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**wootui** is a Terminal User Interface (TUI) application built with OpenTUI and React that translates WooCommerce product catalogs to multiple languages using Google's Gemini AI. It supports WPML (WordPress Multilingual Plugin) format and handles complex product attributes, metadata, and SEO fields.

## Development Commands

```bash
# Development
bun run dev              # Run in watch mode for development

# Building
bun run build            # Build to dist/
bun run build:macos-arm64   # Compile for macOS ARM64
bun run build:macos-x64     # Compile for macOS x64
bun run build:windows       # Compile for Windows
bun run build:linux-x64     # Compile for Linux x64
bun run build:linux-arm64   # Compile for Linux ARM64

# Code Quality
bunx @biomejs/biome check .         # Run linter
bunx @biomejs/biome check --write . # Fix linting issues
bunx @biomejs/biome format .        # Format code

# Release
npm version patch    # Bump patch version (e.g., 1.0.0 -> 1.0.1)
npm version minor    # Bump minor version (e.g., 1.0.0 -> 1.1.0)
npm version major    # Bump major version (e.g., 1.0.0 -> 2.0.0)
npm version 1.2.3   # Set specific version
```

**Release Process:**
1. Make code changes and commit: `git add . && git commit -m "feat: new feature"`
2. Update version and create tag: `npm version patch/minor/major`
3. Push commits and tags: `git push && git push --tags`
4. GitHub Actions automatically builds release on tag push (triggers on `v*` tags)

**Notes:**
- `npm version` updates `package.json` version, creates a commit, and creates a git tag with `v` prefix
- Version is displayed in bottom-right corner of both MainScreen and SettingsScreen
- Release tags use `v` prefix automatically (e.g., `v1.0.0`) - created by `npm version`
- Version file (`src/utils/version.ts`) is generated at build time and should not be committed

## Architecture

### Entry Point & Application Flow
- `src/index.tsx` - App entry point with screen navigation (Main/Settings) and Toaster setup
- Uses `@opentui/core` renderer and `@opentui/react` for terminal rendering
- Configuration managed via `conf` package as module-level singleton in `src/utils/config.ts`
- **Global config access**: Any file (component, hook, utility function) can import and read `appConfig` directly - no need to pass config as props or parameters

### Path Aliases
TypeScript path aliases are configured in `tsconfig.json` for cleaner imports:
- `@/*` - Maps to `src/*` (e.g., `@/types/config`, `@/utils/woo-csv`)
- `@/utils/*` - Maps to `src/utils/*`
- `@/hooks/*` - Maps to `src/hooks/*`
- `@/components/*` - Maps to `src/components/*`
- `@/screens/*` - Maps to `src/screens/*`
- `@/types/*` - Maps to `src/types/*`

**Example:**
```typescript
// Good: Using path alias
import { appConfig } from '@/utils/config';
import type { LanguageCode } from '@/types/language-code';

// Also acceptable: Relative import
import { appConfig } from '../utils/config';
```

### Core Screens
- **MainScreen** (`src/screens/main-screen.tsx`) - Multi-step wizard for translation workflow
- **SettingsScreen** (`src/screens/settings-screen.tsx`) - Configure API key, model ID, batch size, output directory

### Wizard System
The application uses a custom step-based wizard component (`src/components/wizard/`) for the main translation flow:

1. **CSV Path** - User provides path to WooCommerce export CSV
2. **Columns Selection** - Choose which columns to translate (SEO meta, attributes, etc.)
3. **Target Languages** - Select languages and configure override behavior for existing translations
4. **Token & Price Estimation** - Preview costs before proceeding
5. **Translate** - Execute translation via Gemini API
6. **Results** - Display translation results with costs and output paths

**Wizard Architecture:**
- `wizard.tsx` - Main wizard component with keyboard navigation (Tab/Shift+Tab between steps, Ctrl+Return to submit)
- `wizard-context.tsx` - Context provider for wizard state management
- `wizard-step.tsx` - Individual step wrapper with status indicators
- `types.ts` - Defines `WizardStepStatus` enum (IDLE, RUNNING, SUCCESS, ERROR) and related types
- Steps are locked until previous step succeeds (async step submission)
- Uses `WizardStepDefinition` with `render(ctx)` and `onSubmit()` lifecycle

**Main Screen Steps:**
Each wizard step is defined in `src/components/main-screen-steps/` as a separate module:
- `csv-path-step.tsx` - Creates CSV path input step using `createCsvPathStep()`
- `columns-selection-step.tsx` - Creates column selection step using `createColumnsSelectionStep()`
- `target-languages-step.tsx` - Creates language selection step using `createTargetLanguagesStep()`
- `token-and-price-step.tsx` - Creates cost estimation step using `createTokenAndPriceStep()`
- `translate-step.tsx` - Creates translation execution step using `createTranslateStep()`
- `results-step.tsx` - Creates results display step using `createResultsStep()`
- `types.ts` - Shared types, constants (FIXED_COLUMNS, DEFAULT_SEO_META, WPML_INTERNAL_COLUMNS)
- `index.ts` - Barrel export for all step creators and types

**Step Pattern:**
```typescript
export function createXxxStep(): WizardStepDefinition<TranslateWizardValues> {
    return {
        id: 'step-id',
        title: 'Step Title',
        render: (ctx) => {
            // Can read config directly inside render if needed
            const outputDir = appConfig.get('outputDir');
            
            // Render step UI based on ctx.values, ctx.isFocused, ctx.previousStepState
            return <YourComponent />;
        },
        onSubmit: async (values, context) => {
            // Read config directly inside onSubmit - no need to pass as parameters
            const apiKey = appConfig.get('apiKey');
            const modelId = appConfig.get('modelId');
            
            // Receives values from the previous step and the context of the wizard
            // Validates, processes, and returns data for the next step
            return resultData;
        },
    };
}
```

**Wizard Centered Scrolling:**
- The active/focused step is always centered vertically in the viewport
- Uses a scrollbox with `focused={false}` to disable mouse scrolling (keyboard-only navigation)
- Scrollbar is hidden via `verticalScrollbarOptions={{ visible: false }}`
- Dynamic padding is applied to scrollbox content to enable centering at edges:
  - Top padding = `(viewportHeight - firstStepHeight) / 2` allows first step to center
  - Bottom padding = `(viewportHeight - lastStepHeight) / 2` allows last step to center
- `recenterScrollbox()` callback is passed to step render functions for manual recentering when step content changes dynamically
- Scrollbox ref (`ScrollBoxRenderable`) provides access to `scrollTo()`, `viewport.height`, and `content` for programmatic control

### Translation Pipeline
Located in `src/utils/`:

1. **CSV Parsing** (`woo-csv.ts`)
   - Parses WooCommerce CSV with WPML columns
   - Identifies source products vs existing translations
   - Maps attribute columns (WooCommerce uses 4 columns per attribute: name, value, visibility, order)
   - Groups products by target language

2. **Product Preparation** (`woo-csv.ts::prepareProductsForTranslation()`)
   - Extracts translatable content: static columns (Name, Description, Tags), attributes, and metadata
   - Filters products needing translation based on target languages and override settings
   - Flattens to key-value format for AI processing

3. **TOON Encoding** (`translate.ts`)
   - Uses `@toon-format/toon` to encode products into a compact format for Gemini
   - Replaces empty values with unique placeholders (`NULL_<columnName>`) to preserve column integrity
   - Sanitizes strings (quotes, backslashes) for proper parsing

4. **AI Translation** (`woo-csv.ts::translate()`)
   - Calls Gemini API with specialized system prompt for TOON format preservation
   - Handles brand name preservation, HTML attribute escaping, and NULL placeholder integrity
   - Tracks token usage and costs
   - Uses `ai` SDK with `@ai-sdk/google` provider

5. **Post-Processing** (`woo-csv.ts::postProcessTranslatedProducts()`)
   - Decodes TOON response back to JSON
   - Translates attribute names separately
   - Generates `_wpml_import_wc_local_attribute_labels` column (slug-to-translated-name mapping)
   - Merges with original source products
   - Outputs CSV ready for WPML import

### Components

**Reusable UI Components:**
- `Form` (`src/components/form/`) - Form system with TextField, Dropdown, Description components
- `ActionPanel` (`src/components/action-panel/`) - Command palette with keyboard shortcuts
- `Toggle` (`src/components/toggle/`) - Toggle switch for boolean settings
- `TranslationMatrix` (`src/components/translation-matrix/`) - Visual grid showing translation coverage
- `StepBox` (`src/components/step-box.tsx`) - Styled container for wizard steps with status indicators
- `Footer` (`src/components/footer.tsx`) - Bottom bar with keyboard shortcuts

### Hooks

**Custom Hooks Pattern:**
- All custom hooks live in `src/hooks/` directory
- Each hook is in its own file (e.g., `use-output-dir.ts`, `use-open-output-folder.ts`)
- **DO NOT** use barrel exports (index.ts) for hooks - import directly from hook files
- Hook naming: `use` prefix + descriptive name in kebab-case for files, camelCase for function
- Hooks should be pure functions that encapsulate reusable logic
- Hooks that need config access import `appConfig` directly from `@/utils/config` and read values internally

**Example:**
```typescript
// Good: Direct import
import { useOutputDir } from '../hooks/use-output-dir';

// Bad: Barrel export
import { useOutputDir } from '../hooks';

// Inside the hook implementation:
export function useOutputDir(): string {
    // Read config directly inside the hook - no need to pass as parameter
    const configuredDir = appConfig.get('outputDir');
    if (configuredDir && configuredDir.trim() !== '') {
        return configuredDir;
    }
    return path.join(os.homedir(), 'Downloads');
}
```

**Available Hooks:**
- `useOutputDir()` - Returns output directory with consistent default (~/Downloads), reads from `appConfig` internally
- `useOpenOutputFolder()` - Returns function to open output folder in system file explorer, reads from `appConfig` internally
- `useInputHandler` - Keyboard input handling with callbacks
- `useForm` - Form state management
- `useWizard` - Wizard state management

**Note:** Hooks like `useOutputDir` and `useOpenOutputFolder` previously took `config` as a parameter but now access `appConfig` directly via import. Similarly, utility functions throughout the codebase import and read from `appConfig` directly instead of receiving config values as parameters.

### OpenTUI-Specific Patterns

**Critical Rules:**
- Use `<box>` for ALL layout (Flexbox-based)
- Use `<text>` ONLY for text rendering - never nest `<box>` inside `<text>`
- Interactive elements require `focused={true}` prop when active
- Use `React.memo()` to prevent flickering from re-renders
- Colors via `fg` and `bg` props (hex codes preferred)
- Text styling via `TextAttributes` enum (BOLD, DIM, etc.)

**Custom JSX Pragma:**
- `jsxImportSource: "@opentui/react"` in tsconfig.json
- Lowercase native elements: `<box>`, `<text>`, `<input>`, `<scrollbox>`

## Code Style (from `.cursor/rules/code_practices.md`)

**Critical Style Rules:**
- Use **tabs** for indentation (conflicts with biome.json which uses 4 spaces - biome.json takes precedence)
- Single quotes for strings
- **Semicolons required** (per biome.json)
- Functional components with `function` keyword
- PascalCase for components/interfaces, camelCase for variables/functions
- Boolean variables prefixed with `is`, `has`, `can`
- Event handlers prefixed with `handle`

**TypeScript:**
- Prefer `interface` over `type` for objects
- Strict mode enabled
- JSDoc for public functions

## Key Files

- `src/utils/config.ts` - Application config singleton (`appConfig`) using `conf` package
- `src/utils/woo-csv.ts` - CSV parsing, product preparation, translation orchestration
- `src/utils/translate.ts` - Legacy translation logic (reference for prompts/encoding patterns)
- `src/utils/prompts.ts` - Gemini system and user prompts
- `src/utils/attibute_parser.ts` - WooCommerce attribute column mapping and extraction
- `src/utils/dynamic_schema.ts` - Zod schema generation for CSV validation
- `src/types/language-code.ts` - Supported language codes enum
- `src/types/config.ts` - User configuration schema (ConfigSchema interface)
- `src/components/main-screen-steps/` - Wizard step definitions and shared types

## Important Context

**WPML Integration:**
- The app expects CSVs exported from WooCommerce with WPML plugin
- Key WPML columns: `Meta: _wpml_import_source_language_code`, `Meta: _wpml_import_language_code`, `Meta: _wpml_import_translation_group`
- Translation group links source products to their translations

**Gemini API:**
- Uses `gemini-2.5-pro` by default
- Pricing calculated per 1M tokens (configurable in `src/utils/gemini-pricing.ts`)
- TOON format is critical for preserving CSV structure through AI translation

**Configuration:**
- **Module-level singleton pattern**: Configuration is created once in `src/utils/config.ts` and exported as `appConfig`
- Stored via `conf` package in user's home directory (`~/.config/wootui/config.json`)
- Settings with defaults:
  - `apiKey`: '' (empty, must be configured by user)
  - `modelId`: 'gemini-2.5-pro'
  - `batchSize`: 5
  - `outputDir`: User's Downloads folder (cross-platform via `os.homedir()` + `path.join()`)
- **Access anywhere via direct import**: `import { appConfig } from '@/utils/config'`
  - Works in components, hooks, utility functions, step definitions, etc.
  - No need to pass config as props or function parameters
- Read values: `appConfig.get('apiKey')`
- Write values: `appConfig.set('apiKey', 'new-value')`
- **No prop drilling or parameter passing**: Import `appConfig` directly where needed instead of passing config values through props or function parameters
- **Shared instance**: All imports reference the same singleton object; changes via `.set()` are immediately visible to all consumers
- **Persistence**: Changes are automatically persisted to disk synchronously by the `conf` package
- Output directory defaults work seamlessly on macOS (`~/Downloads`), Linux (`~/Downloads`), and Windows (`C:\Users\username\Downloads`)

**Config Pattern:**
```typescript
// In any component, hook, or utility function:
import { appConfig } from '@/utils/config';

// Read config directly in functions - no need to pass as parameters
function translateProducts() {
    const apiKey = appConfig.get('apiKey');
    const modelId = appConfig.get('modelId');
    const batchSize = appConfig.get('batchSize');
    // Use values directly...
}

// Write config
appConfig.set('modelId', 'gemini-2.5-pro');
appConfig.set('outputDir', '/custom/path');

// Bad: Don't pass config values as parameters
function translateProducts(apiKey: string, modelId: string) { /* ... */ }

// Good: Read directly from appConfig inside the function
function translateProducts() {
    const apiKey = appConfig.get('apiKey');
    const modelId = appConfig.get('modelId');
    // ...
}
```

**Windows Terminal Keyboard Behavior:**
- Windows Terminal has a known issue where `Ctrl+Return` is not properly sent to applications
- The code checks for both `key.name === 'return'` and `key.name === 'j'` when `ctrl` is pressed
- This allows Windows users to use either `Ctrl+Enter` or `Ctrl+J` to submit wizard steps
- See: https://github.com/microsoft/terminal/issues/6912
