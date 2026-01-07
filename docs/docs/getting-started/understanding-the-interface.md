---
sidebar_position: 3
---

# Understanding the Interface

Learn how to navigate WooTUI's terminal interface efficiently. WooTUI is designed to be fast and intuitive with keyboard-only navigation.

## Terminal User Interface (TUI)

WooTUI is built with **OpenTUI**, a framework for creating rich terminal applications. Unlike traditional command-line tools, WooTUI provides:

- **Visual interface** rendered in your terminal
- **Keyboard navigation** (no mouse required)
- **Real-time updates** and progress indicators
- **Dark mode** terminal aesthetic

:::tip Why Terminal UI?
Terminal applications are fast, lightweight, and work anywhere—including remote servers via SSH. Once you master the keyboard shortcuts, you'll be more productive than with traditional GUIs!
:::

---

## Two Main Screens

WooTUI has two primary screens you'll interact with:

### 1. Main Screen (Translation Wizard)

The **Main Screen** is where you perform translations. It features a 6-step wizard that guides you through the entire process:

```
┌─────────────────────────────────────┐
│          WooTUI v1.0.0              │
│  Translate WooCommerce products     │
├─────────────────────────────────────┤
│                                     │
│  ○ CSV Path                         │  ← Completed
│  ● Columns Selection (Active)       │  ← Current step
│  ○ Target Languages                 │  ← Locked (not yet accessible)
│  ○ Token & Price Estimation         │
│  ○ Translate                        │
│  ○ Results                          │
│                                     │
├─────────────────────────────────────┤
│  Tab/↑↓: Navigate  Enter: Select    │
│  Ctrl+Enter: Submit  s: Settings    │
└─────────────────────────────────────┘
```

**Status Indicators:**
- **●** (Filled circle) - Current/active step
- **○** (Empty circle) - Completed step or not yet accessible
- **✓** (Checkmark) - Successfully completed step
- **✗** (X mark) - Step with error

### 2. Settings Screen

The **Settings Screen** is where you configure WooTUI. Access it by pressing **`s`** from the Main Screen.

```
┌─────────────────────────────────────┐
│            Settings                 │
├─────────────────────────────────────┤
│                                     │
│  API Key:                           │
│  [AIza************************]     │
│                                     │
│  Model ID:                          │
│  [gemini-2.5-pro          ▼]        │
│                                     │
│  Batch Size:                        │
│  [5                        ]        │
│                                     │
│  Output Directory:                  │
│  [/Users/you/Downloads     ]        │
│                                     │
├─────────────────────────────────────┤
│  Tab: Navigate  Enter: Save         │
│  Esc: Back  Ctrl+S: Save & Exit     │
└─────────────────────────────────────┘
```

---

## The 6-Step Wizard

The wizard guides you through the translation workflow step-by-step. Each step must be completed before the next one unlocks.

### Step 1: CSV Path
- **Purpose**: Select your WooCommerce export CSV
- **Input**: Text field for file path
- **Submit**: `Ctrl+Enter` or `Ctrl+J`

### Step 2: Columns Selection
- **Purpose**: Choose which columns to translate
- **Input**: Checkboxes for each column
- **Navigation**: `Tab` to move, `Space` to toggle
- **Submit**: `Ctrl+Enter` or `Ctrl+J`

### Step 3: Target Languages
- **Purpose**: Select one or more target languages
- **Input**: Language checkboxes + override toggle
- **Submit**: `Ctrl+Enter` or `Ctrl+J`

### Step 4: Token & Price Estimation
- **Purpose**: Review estimated costs before proceeding
- **Display**: Token count and price estimate
- **Action**: Confirm or go back

### Step 5: Translate
- **Purpose**: Execute the translation
- **Display**: Progress bar and status updates
- **Duration**: Varies by catalog size (30s - 5min)

### Step 6: Results
- **Purpose**: View translation summary and output location
- **Actions**: Open output folder (`o`) or restart (`Enter`)

:::info Step Locking
Steps remain **locked** until the previous step succeeds. This prevents errors and ensures you provide all required information in order.
:::

---

## Keyboard Navigation

WooTUI is designed for keyboard-only navigation. Here are the essential shortcuts:

### Global Shortcuts (Work Anywhere)

| Shortcut | Action |
|----------|--------|
| `s` | Open Settings screen |
| `q` | Quit WooTUI |
| `Ctrl+C` | Force quit (emergency exit) |

### Main Screen (Wizard)

| Shortcut | Action |
|----------|--------|
| `Tab` | Move to next step/field |
| `Shift+Tab` | Move to previous step/field |
| `Enter` | Activate/select focused element |
| `Ctrl+Enter` | Submit current step |
| `Ctrl+J` | Submit current step (Windows Terminal workaround) |
| `Esc` | Cancel or blur current input |

### Settings Screen

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate to next field |
| `Shift+Tab` | Navigate to previous field |
| `Enter` | Save current field |
| `Esc` | Return to Main Screen (without saving) |
| `Ctrl+S` | Save all settings and return to Main Screen |

### Form Controls

**Text Fields:**
- Standard text editing (type, backspace, arrow keys)
- `Enter` saves the field
- `Esc` cancels editing

**Dropdowns:**
- `Arrow Up/Down` to navigate options
- `Enter` to select
- `Esc` to cancel

**Checkboxes:**
- `Space` or `Enter` to toggle on/off
- Visual indicator shows selected state

**Toggles:**
- `Space` or `Enter` to switch between on/off
- Shows current state visually

---

## Centered Scrolling

WooTUI keeps the active step **centered vertically** in your terminal window. As you progress through the wizard, the viewport automatically scrolls to keep the current step in focus.

**Why centered?**
- Easier to see what you're working on
- Less eye movement required
- Natural reading position

**Dynamic padding:**
- The first step can center when active
- The last step can center when you reach it
- No manual scrolling needed!

:::tip Terminal Height
For the best experience, use a terminal window with at least **24 lines** of height. This allows comfortable viewing of wizard steps with context.
:::

---

## Visual Feedback

WooTUI provides rich visual feedback to guide you:

### Status Colors

- **Purple** - Primary actions, active elements, headings
- **Orange** - Hover states and accents (if your terminal supports it)
- **Green** - Success messages and completed steps
- **Red** - Errors and warnings
- **Gray** - Secondary text and inactive elements

### Step States

**Idle (Not Started)**
```
○ CSV Path
```

**Active (Current Step)**
```
● Columns Selection
```

**Running (Processing)**
```
⏳ Translate
```

**Success (Completed)**
```
✓ Translate
```

**Error (Failed)**
```
✗ Translate
```

### Progress Indicators

During translation (Step 5), you'll see:
- **Progress bar** showing completion percentage
- **Current batch** (e.g., "Processing batch 2 of 5")
- **Estimated time remaining** (approximate)
- **Status messages** (e.g., "Encoding products...", "Translating...")

---

## Footer Shortcuts

At the bottom of each screen, you'll see a **footer** with context-specific shortcuts:

**Main Screen Footer:**
```
Tab/↑↓: Navigate  Enter: Select  Ctrl+Enter: Submit  s: Settings  q: Quit
```

**Settings Screen Footer:**
```
Tab: Navigate  Enter: Save  Esc: Back  Ctrl+S: Save & Exit
```

**Results Screen Footer:**
```
o: Open folder  Enter: New translation  q: Quit
```

These shortcuts change based on what actions are available in the current context.

---

## Tips for Efficient Navigation

### 1. Use Tab, Not Arrow Keys

While arrow keys work in some contexts (dropdowns, lists), **Tab** and **Shift+Tab** are more reliable for moving between form fields and wizard steps.

### 2. Learn the Submit Shortcut

**`Ctrl+Enter`** (or **`Ctrl+J`** on Windows Terminal) is the quickest way to submit a step. Don't navigate all the way to a "Submit" button—just hit the shortcut!

### 3. Quick Settings Access

Press **`s`** from anywhere in the Main Screen to jump to Settings. No need to quit and relaunch.

### 4. Use Esc for Quick Cancels

If you accidentally focus a field or open a dropdown, **`Esc`** quickly cancels without making changes.

### 5. Memorize 3 Key Shortcuts

Master these three and you'll be productive immediately:
1. **`Tab`** - Move around
2. **`Ctrl+Enter`** - Submit
3. **`Esc`** - Cancel/back

---

## Dark Mode Aesthetic

WooTUI uses a **dark terminal theme** inspired by modern code editors. The color scheme is:

- **Background**: Dark blue-gray (#1a1b26)
- **Surface**: Slightly lighter gray (#24283b)
- **Primary**: Purple (#a76bf2)
- **Accent**: Orange (#ffb870)
- **Text**: Light gray (#a9b1ba)

This theme reduces eye strain during extended use and looks great in modern terminal emulators like:
- **macOS**: iTerm2, Terminal.app
- **Windows**: Windows Terminal, Alacritty
- **Linux**: GNOME Terminal, Kitty, Alacritty

:::tip Terminal Customization
WooTUI adapts to your terminal's color scheme, but for the best experience, use a terminal with 24-bit color support.
:::

---

## Windows Terminal Keyboard Issue

If you're using **Windows Terminal**, you may encounter a known issue where `Ctrl+Enter` doesn't work properly.

**Issue**: [microsoft/terminal#6912](https://github.com/microsoft/terminal/issues/6912)

**Workaround**: Use **`Ctrl+J`** instead of `Ctrl+Enter` to submit wizard steps.

**Why both shortcuts?**
- `Ctrl+Enter` works on macOS, Linux, and most Windows terminals
- `Ctrl+J` is a fallback specifically for Windows Terminal users

---

## Configuration Persistence

All settings you configure in the Settings Screen are **automatically saved** to disk:

**Config file location:**
- **macOS/Linux**: `~/.config/wootui/config.json`
- **Windows**: `%APPDATA%\wootui\config.json`

**What's saved:**
- API Key (encrypted? No—keep it safe!)
- Model ID
- Batch Size
- Output Directory

**When changes are saved:**
- Automatically when you edit a field and press `Enter`
- When you press `Ctrl+S` to save and exit
- **Not** when you press `Esc` (cancels without saving)

:::caution API Key Security
Your API key is stored in plain text in the config file. Keep this file private and don't commit it to version control!
:::

---

## Workflow Example

Here's a typical workflow showing how the interface guides you:

1. **Launch WooTUI** (`wootui`)
   - Main Screen appears
   - Step 1 (CSV Path) is active

2. **Enter CSV path** and press `Ctrl+Enter`
   - Step 1 marked as complete (✓)
   - Step 2 (Columns Selection) becomes active and centers

3. **Select columns** using `Tab` and `Space`
   - Press `Ctrl+Enter` when done
   - Step 3 (Target Languages) activates

4. **Choose language** and override setting
   - Press `Ctrl+Enter`
   - Step 4 (Token & Price) shows estimates

5. **Review costs** and press `Ctrl+Enter`
   - Step 5 (Translate) starts automatically
   - Progress bar shows real-time status

6. **Translation completes**
   - Step 6 (Results) shows summary
   - Press `o` to open output folder or `Enter` to restart

Total time: **~2 minutes** for a small catalog!

---

## Common Questions

### Can I use a mouse?

No, WooTUI is keyboard-only. This is by design—keyboard navigation is faster and works in any terminal environment, including remote SSH sessions.

### Can I resize the terminal while WooTUI is running?

Yes! WooTUI adapts to terminal size changes. The wizard automatically re-centers when you resize the window.

### What if I make a mistake in an earlier step?

Currently, you can't go back to a previous step once it's completed. Press `q` to quit, then restart WooTUI and redo the wizard. (Future versions may support step navigation.)

### Can I run multiple translations in parallel?

No, WooTUI is single-threaded and runs one translation workflow at a time. You can run multiple instances in separate terminal windows if needed.

---

## Next Steps

Now that you understand the interface, you're ready to explore more advanced workflows:

**Improve Your Skills:**
- [Basic Product Translation](../workflows/basic-product-translation.md) - Best practices and tips
- [Keyboard Shortcuts Reference](../reference/keyboard-shortcuts.md) - Complete shortcut list

**Configure WooTUI:**
- [Settings Overview](../configuration/settings-overview.md) - Customize your setup
- [Model Selection](../configuration/model-selection.md) - Choose the right Gemini model

**Handle Issues:**
- [Common Errors](../troubleshooting/common-errors.md) - Solutions to frequent problems

---

## Quick Reference Card

**Print this or keep it handy!**

| Action | Shortcut |
|--------|----------|
| Move forward | `Tab` |
| Move backward | `Shift+Tab` |
| Select/activate | `Enter` |
| Submit step | `Ctrl+Enter` or `Ctrl+J` |
| Cancel/back | `Esc` |
| Open Settings | `s` |
| Quit | `q` or `Ctrl+C` |
| Toggle checkbox | `Space` |
| Save settings | `Ctrl+S` |
| Open output folder | `o` (Results screen) |

**Step Order:**
1. CSV Path → 2. Columns → 3. Languages → 4. Costs → 5. Translate → 6. Results
