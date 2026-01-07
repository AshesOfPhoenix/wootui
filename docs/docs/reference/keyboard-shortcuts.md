---
sidebar_position: 1
---

# Keyboard Shortcuts

Complete reference of all keyboard shortcuts in WooTUI.

## Global Shortcuts

Work anywhere in WooTUI:

| Shortcut | Action |
|----------|--------|
| `s` | Open Settings screen |
| `q` | Quit WooTUI |
| `Ctrl+C` | Force quit (emergency exit) |

---

## Main Screen (Wizard)

Navigation and interaction:

| Shortcut | Action |
|----------|--------|
| `Tab` | Move to next step/field |
| `Shift+Tab` | Move to previous step/field |
| `Enter` | Activate/select focused element |
| `Ctrl+Enter` | Submit current step |
| `Ctrl+J` | Submit current step (Windows Terminal alternative) |
| `Esc` | Cancel or blur current input |
| `Arrow Up` | Navigate dropdown options |
| `Arrow Down` | Navigate dropdown options |

---

## Settings Screen

Configuration navigation:

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate to next field |
| `Shift+Tab` | Navigate to previous field |
| `Enter` | Save current field value |
| `Ctrl+S` | Save all settings and return to Main Screen |
| `Esc` | Return to Main Screen (without saving) |

---

## Form Controls

### Text Fields
- Type normally to enter text
- `Backspace` / `Delete` to remove characters
- `Arrow Left` / `Arrow Right` to move cursor
- `Enter` to save field
- `Esc` to cancel editing

### Dropdowns
- `Arrow Up` / `Arrow Down` to navigate options
- `Enter` to select highlighted option
- `Esc` to close without selecting

### Checkboxes
- `Space` to toggle on/off
- `Enter` to toggle on/off
- Visual indicator shows selected state

### Toggles
- `Space` to switch between on/off
- `Enter` to switch between on/off

---

## Results Screen

After translation completes:

| Shortcut | Action |
|----------|--------|
| `o` | Open output folder in file explorer |
| `Enter` | Return to Main Screen (start new translation) |
| `q` | Quit WooTUI |

---

## Platform Differences

### Windows Terminal Issue
If `Ctrl+Enter` doesn't work in Windows Terminal, use `Ctrl+J` instead.

**Why?** Windows Terminal has a [known issue](https://github.com/microsoft/terminal/issues/6912) where `Ctrl+Enter` is not sent to applications.

### Alternative Terminals (Windows)
These terminals work with `Ctrl+Enter`:
- Command Prompt
- PowerShell (standalone)
- Git Bash
- Alacritty

---

## Quick Reference Card

**Print this or keep handy:**

### Essential Shortcuts
| What | Shortcut |
|------|----------|
| Move forward | `Tab` |
| Move backward | `Shift+Tab` |
| Select/activate | `Enter` |
| Submit step | `Ctrl+Enter` or `Ctrl+J` |
| Cancel | `Esc` |
| Settings | `s` |
| Quit | `q` |

### Form Shortcuts
| What | Shortcut |
|------|----------|
| Toggle checkbox | `Space` |
| Navigate dropdown | `Arrow Up/Down` |
| Save field | `Enter` |
| Save all settings | `Ctrl+S` |
| Open output folder | `o` (Results screen) |

---

## Tips for Efficient Use

### 1. Master Three Keys
Learn these and you'll be 90% productive:
- **`Tab`** - Navigate
- **`Ctrl+Enter`** - Submit
- **`Esc`** - Cancel

### 2. Use Submit Shortcut
Don't navigate to a Submit button - just press `Ctrl+Enter` when ready.

### 3. Quick Settings Access
Press `s` from anywhere to jump to Settings. No need to quit.

### 4. Arrow Keys for Dropdowns
Use `Arrow Up/Down` to navigate language/column dropdowns quickly.

### 5. Esc for Quick Cancels
Accidentally focused a field? `Esc` backs out instantly.

---

## Next Steps

- [Understanding the Interface](../getting-started/understanding-the-interface.md) - UI overview
- [First Translation](../getting-started/first-translation.md) - Practice using shortcuts
