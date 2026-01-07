---
sidebar_position: 2
---

# Gemini API Setup

Get your Google Gemini API key to use WooTUI for translations.

## Step 1: Visit Google AI Studio

Go to: https://ai.google.dev/gemini-api/docs/api-key

## Step 2: Sign In

Sign in with your Google account (any Gmail account works).

## Step 3: Create API Key

1. Click **"Get API Key"** or **"Create API Key"**
2. Select a Google Cloud project (or create new one)
3. Copy your API key (starts with `AIza...`)

## Step 4: Enter in WooTUI

1. Launch WooTUI: `wootui`
2. Press `s` to open Settings
3. Paste API key in "API Key" field
4. Press `Enter` to save

Done! You're ready to translate.

---

## API Key Security

### Do
- ✅ Keep API key private
- ✅ Store securely (WooTUI config file is local only)
- ✅ Regenerate key if compromised

### Don't
- ❌ Share key publicly
- ❌ Commit key to GitHub
- ❌ Use same key across multiple apps (create separate keys)

---

## Free Tier

Google Gemini offers a **free tier** with generous limits:
- 15 requests per minute
- Enough for small-medium catalogs

**Typical usage**:
- 100 products ≈ 20 requests (with batch size 5)
- Translation time ≈ 2-3 minutes

**When to upgrade**: If you hit rate limits frequently or need faster processing for large catalogs (1000+ products).

---

## Troubleshooting

### "Invalid API Key" Error

**Solution**:
1. Verify key starts with `AIza` and has no extra spaces
2. Check key is enabled in Google Cloud Console
3. Ensure Gemini API is enabled for your project

### "Quota Exceeded" Error

**Solution**:
- Wait 1 minute and retry
- Reduce batch size to 3-5
- Upgrade to paid tier in Google Cloud Console

---

## Next Steps

- [Model Selection](./model-selection.md) - Choose gemini-pro vs gemini-flash
- [First Translation](../getting-started/first-translation.md) - Start translating
