---
sidebar_position: 1
---

# Settings Overview

Configure WooTUI settings for your workflow. Press `s` from the Main Screen to open Settings.

## Available Settings

### API Key (Required)
Your Google Gemini API key. Get one at [Google AI Studio](https://ai.google.dev/gemini-api/docs/api-key).

**Format**: Starts with `AIza...`

:::caution Security
Your API key is stored in plain text at `~/.config/wootui/config.json` (macOS/Linux) or `%APPDATA%\wootui\config.json` (Windows). Keep this file private!
:::

### Model ID
Which Gemini model to use for translations.

**Options**:
- `gemini-2.5-pro` (default) - Best quality, slower, ~$1/1M tokens
- `gemini-2.5-flash` - Faster, cheaper (~$0.20/1M tokens), slightly lower quality

**When to change**: Use flash for simple products or large catalogs where cost matters more than perfect quality.

### Batch Size
Number of products processed together in each batch.

**Default**: 5 products

**Range**: 3-20

**Recommendations**:
- Simple products: 10-15
- Complex products: 5-8
- Free API tier: 3-5 (avoid rate limits)

See [Batch Processing](../workflows/batch-processing.md) for details.

### Output Directory
Where translated CSV files are saved.

**Default**: `~/Downloads` (macOS/Linux) or `C:\Users\YourName\Downloads` (Windows)

**Tip**: Use a dedicated folder like `~/Documents/WooTUI-Translations` to keep files organized.

---

## How to Change Settings

1. Press `s` from Main Screen
2. Use `Tab` to navigate between fields
3. Type new value
4. Press `Enter` to save
5. Press `Esc` to return to Main Screen

**Or** press `Ctrl+S` to save all and exit Settings immediately.

---

## Configuration File Location

Settings are saved automatically to:
- **macOS/Linux**: `~/.config/wootui/config.json`
- **Windows**: `%APPDATA%\wootui\config.json`

**To reset settings**: Delete the config file and restart WooTUI.

---

## Next Steps

- [Gemini API Setup](./gemini-api-setup.md) - Get your API key
- [Model Selection](./model-selection.md) - Choose the right model
