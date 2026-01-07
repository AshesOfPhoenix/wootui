---
sidebar_position: 1
---

# Installation

Get WooTUI installed on your system in just a few minutes.

## Prerequisites

Before installing WooTUI, you'll need:

### 1. Google Gemini API Key (Required)

WooTUI uses Google's Gemini AI for translations. You'll need an API key to use the application.

**How to get your API key:**

1. Visit [Google AI Studio](https://ai.google.dev/gemini-api/docs/api-key)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy your API key (starts with `AIza...`)

**Keep your API key safe!** Don't share it publicly or commit it to version control.

:::tip Free Tier Available
Google Gemini offers a free tier with generous limits for testing. You can start translating without entering payment information.
:::

### 2. WooCommerce with WPML

WooTUI is designed to work with:
- **WooCommerce** - Your WordPress e-commerce plugin
- **WPML (WordPress Multilingual Plugin)** - For managing translations

If you haven't set up WPML yet, you can still use WooTUI—just note that you'll need WPML to import the translated products back into your store.

### 3. Supported Operating Systems

WooTUI works on:
- macOS (ARM64 and x64)
- Windows (x64)
- Linux (x64 and ARM64)

---

## Installation Instructions

### macOS

Open your terminal and run:

```bash
curl -sf https://ashesofphoenix.github.io/wootui/install | bash
```

This script will:
- Download the latest WooTUI binary for your architecture
- Install it to `~/.local/bin/wootui`
- Make it executable

**After installation, you may need to add `~/.local/bin` to your PATH:**

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

(Use `~/.bash_profile` if you're using Bash instead of Zsh)

---

### Windows

Open PowerShell and run:

```powershell
irm https://ashesofphoenix.github.io/wootui/install.ps1 | iex
```

This script will:
- Download the latest WooTUI binary for Windows
- Install it to `%LOCALAPPDATA%\Programs\wootui`
- Add it to your PATH automatically

**You may need to restart your terminal** after installation for the PATH changes to take effect.

:::caution Windows Terminal Keyboard Issue
If you're using Windows Terminal, `Ctrl+Enter` may not work due to a [known issue](https://github.com/microsoft/terminal/issues/6912). Use **`Ctrl+J`** instead to submit wizard steps.
:::

---

### Linux

For **x64** (most desktop systems):

```bash
curl -sf https://ashesofphoenix.github.io/wootui/install | bash
```

For **ARM64** (Raspberry Pi, ARM servers):

```bash
curl -sf https://ashesofphoenix.github.io/wootui/install-arm64 | bash
```

The script will install WooTUI to `~/.local/bin/wootui` and make it executable.

**Add to PATH if needed:**

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

---

## Verifying Installation

Check that WooTUI is installed correctly:

```bash
wootui --version
```

You should see output like:

```
WooTUI v1.0.0
```

If you see a "command not found" error, make sure `~/.local/bin` (or the Windows equivalent) is in your PATH.

---

## First Launch

When you first launch WooTUI, you'll be taken to the **Settings Screen** to configure your API key:

```bash
wootui
```

You'll see:

1. **API Key** - Paste your Gemini API key here
2. **Model ID** - Leave as `gemini-2.5-pro` (recommended)
3. **Batch Size** - Leave as `5` (default)
4. **Output Directory** - Defaults to `~/Downloads`

### Setting Your API Key

1. Press `Tab` to navigate to the API Key field
2. Paste your Gemini API key (the one starting with `AIza...`)
3. Press `Enter` to save
4. Press `Esc` to return to the Main Screen

:::tip Configuration Persistence
Your settings are saved automatically to:
- **macOS/Linux**: `~/.config/wootui/config.json`
- **Windows**: `%APPDATA%\wootui\config.json`

You only need to enter your API key once!
:::

---

## Troubleshooting Installation

### "Command not found" after installation

**Solution**: Add the installation directory to your PATH.

**macOS/Linux:**
```bash
export PATH="$HOME/.local/bin:$PATH"
```

**Windows:** Restart your terminal or PowerShell window.

---

### Installation script fails or times out

**Solution**: Download the binary manually from the [GitHub Releases page](https://github.com/ashesofphoenix/wootui/releases) and place it in your PATH.

---

### Permission denied (macOS/Linux)

**Solution**: Make the binary executable:

```bash
chmod +x ~/.local/bin/wootui
```

---

### Windows Defender or antivirus blocks installation

**Solution**: Temporarily disable antivirus or add an exception for WooTUI. The binary is safe—it's just not code-signed yet.

---

### "SSL certificate problem" during download

**Solution**: Update your system's SSL certificates:

**macOS:**
```bash
brew install openssl
```

**Ubuntu/Debian:**
```bash
sudo apt-get update && sudo apt-get install ca-certificates
```

---

## Uninstalling WooTUI

If you need to uninstall WooTUI:

**macOS/Linux:**
```bash
rm ~/.local/bin/wootui
rm -rf ~/.config/wootui
```

**Windows:**
```powershell
Remove-Item "$env:LOCALAPPDATA\Programs\wootui" -Recurse
Remove-Item "$env:APPDATA\wootui" -Recurse
```

---

## Next Steps

Now that WooTUI is installed, let's translate your first product!

➡️ [Translate Your First Product](./first-translation.md)

Or learn more about:
- [Understanding the Interface](./understanding-the-interface.md)
- [Configuration Settings](../configuration/settings-overview.md)
- [Getting a Gemini API Key](../configuration/gemini-api-setup.md)
