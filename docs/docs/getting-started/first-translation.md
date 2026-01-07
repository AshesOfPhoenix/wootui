---
sidebar_position: 2
---

# Your First Translation

Translate your first WooCommerce product in just 5 minutes! This guide walks you through the complete process from start to finish.

## Before You Begin

Make sure you have:
- ✅ WooTUI installed ([Installation Guide](./installation.md))
- ✅ Gemini API key configured
- ✅ A WooCommerce product CSV export file

:::tip Don't have a CSV yet?
Go to **WooCommerce → Products → Export** in your WordPress admin. Make sure to export **all columns** and include WPML fields. See [Exporting from WooCommerce](../wpml-integration/exporting-from-woocommerce.md) for detailed instructions.
:::

---

## Step-by-Step Walkthrough

### Step 1: Launch WooTUI

Open your terminal and run:

```bash
wootui
```

You'll see the Main Screen with a 6-step wizard. The first step, **CSV Path**, will be active and ready for input.

---

### Step 2: Select Your CSV File

**What you'll see:**
- A text input field asking for your CSV path
- Instructions below the input

**What to do:**
1. Type or paste the full path to your WooCommerce export CSV
   - Example (macOS): `/Users/yourname/Downloads/woocommerce-products.csv`
   - Example (Windows): `C:\Users\yourname\Downloads\woocommerce-products.csv`
2. Press **`Ctrl+Enter`** (or **`Ctrl+J`** on Windows Terminal) to submit

**What happens:**
- WooTUI parses your CSV and detects:
  - Number of products
  - Source language (from WPML columns)
  - Available columns for translation
  - Existing translations (if any)

:::tip Pro Tip
You can also drag and drop the CSV file into your terminal to get the full path automatically!
:::

---

### Step 3: Choose Columns to Translate

**What you'll see:**
- A list of checkboxes for each translatable column
- Some columns are pre-selected by default

**Recommended for your first translation:**
- ✅ **Name** - Product title
- ✅ **Short Description** - Brief product summary
- ✅ **Description** - Full product description

You can skip:
- ⬜ Attributes (unless you need them translated)
- ⬜ SEO Meta fields (optional for first run)
- ⬜ Tags and Categories

**What to do:**
1. Use **`Tab`** to navigate between checkboxes
2. Press **`Space`** or **`Enter`** to toggle selection
3. Press **`Ctrl+Enter`** (or **`Ctrl+J`**) when you're done

:::info Keep It Simple
For your first translation, stick with the basics (Name, Descriptions). You can always run additional translations for attributes and SEO later!
:::

---

### Step 4: Select Target Language(s)

**What you'll see:**
- A list of supported languages with checkboxes
- An "Override existing translations" option

**What to do:**
1. Select one target language (e.g., **Spanish - es**)
2. Leave "Override existing translations" **unchecked** for now
3. Press **`Ctrl+Enter`** (or **`Ctrl+J`**)

**Override vs Skip:**
- **Override**: Replaces any existing translations for selected products
- **Skip** (default): Only translates products that don't have translations yet

For your first run, skipping existing translations is safer!

---

### Step 5: Review Costs (Token & Price Estimation)

**What you'll see:**
- Estimated input tokens
- Estimated output tokens
- Total estimated cost (in USD)
- A breakdown per product

**Example:**
```
Products to translate: 10
Estimated tokens: 45,000
Estimated cost: $0.12 USD
```

**What to do:**
1. Review the estimated cost
2. If it looks good, press **`Ctrl+Enter`** (or **`Ctrl+J`**) to proceed
3. If it's too high, press **`Esc`** to go back and select fewer columns

:::tip Cost Management
The free tier of Gemini API is very generous. Most small catalogs (10-50 products) cost less than $1 to translate!
:::

---

### Step 6: Translate!

**What you'll see:**
- A progress indicator showing translation progress
- Real-time status updates
- Estimated time remaining

**What happens:**
- WooTUI encodes your products in TOON format (compact AI format)
- Sends batches to the Gemini API
- Receives and decodes translations
- Generates translated CSV with WPML metadata

**This may take:**
- 5 products: ~30 seconds
- 10 products: ~1 minute
- 50 products: ~3-5 minutes

:::note Be Patient
Don't close the terminal while translation is in progress! If you hit an API rate limit, WooTUI will tell you—just wait a minute and try again.
:::

---

### Step 7: View Results

**What you'll see:**
- ✅ Success message
- Number of products translated
- Actual token usage and cost
- Output file location

**Example:**
```
✅ Translation complete!

Products translated: 10
Tokens used: 42,350
Actual cost: $0.11 USD

Output file:
/Users/yourname/Downloads/woocommerce-products_translated_es.csv
```

**What to do:**
1. Press **`o`** to open the output folder in your file manager
2. Or press **`Enter`** to start a new translation

---

## Importing Your Translated CSV

Now that you have a translated CSV, let's import it back into WooCommerce:

### 1. Go to WooCommerce Import

In your WordPress admin:
1. Navigate to **WooCommerce → Products → Import**
2. Click **Choose File** and select your translated CSV:
   - `woocommerce-products_translated_es.csv`
3. Click **Continue**

### 2. Map Columns

WooCommerce should automatically detect and map columns. Verify that:
- Product names match `Name`
- Descriptions match `Description`
- WPML columns are correctly mapped

Click **Continue**.

### 3. Import Options

Select:
- ✅ **Update existing products** (important!)
- Match products by **ID** or **SKU**

Click **Run the importer**.

### 4. Verify Import

After import completes:
1. Go to **WPML → WooCommerce Multilingual**
2. Check that your products now have Spanish translations
3. View a product on the frontend and use the language switcher

---

## Troubleshooting Your First Translation

### "Failed to parse CSV"

**Cause**: CSV file is corrupted or not in UTF-8 encoding.

**Solution**:
1. Open the CSV in a text editor (not Excel)
2. Save it as UTF-8 encoding
3. Make sure all WPML columns are present

See [CSV Format Issues](../troubleshooting/csv-format-issues.md) for more details.

---

### "API key not configured"

**Cause**: You haven't set your Gemini API key yet.

**Solution**:
1. Press **`s`** to open Settings
2. Enter your API key in the first field
3. Press **`Enter`** to save
4. Press **`Esc`** to return to Main Screen

---

### "API rate limit exceeded"

**Cause**: You've hit the free tier rate limit (15 requests/minute).

**Solution**:
1. Wait 1 minute
2. Press **`Enter`** to restart the wizard
3. Try again with the same CSV
4. Consider upgrading to a paid API tier if you have large catalogs

See [API Rate Limits](../troubleshooting/api-rate-limits.md).

---

### Translations look incorrect or incomplete

**Possible causes:**
- Not enough context in product descriptions
- Specialized terminology not recognized by AI
- HTML formatting issues

**Solutions:**
1. Review the output CSV before importing
2. Manually adjust any problematic translations
3. Consider adding more context to source products
4. See [Translation Quality Tips](../workflows/basic-product-translation.md#best-practices)

---

## What You've Learned

Congratulations! You've successfully:
- ✅ Launched WooTUI and navigated the wizard
- ✅ Selected columns and target languages
- ✅ Reviewed costs before translating
- ✅ Generated a translated CSV with WPML metadata
- ✅ Imported translations back into WooCommerce

---

## Next Steps

Now that you've completed your first translation, explore more advanced features:

**Improve Your Workflow:**
- [Understanding the Interface](./understanding-the-interface.md) - Master keyboard navigation
- [Basic Product Translation](../workflows/basic-product-translation.md) - Best practices and tips

**Translate More Content:**
- [Translating Attributes](../workflows/translating-attributes.md) - Handle product variations
- [SEO Meta Translation](../workflows/seo-meta-translation.md) - Optimize for search engines

**Optimize Costs:**
- [Batch Processing](../workflows/batch-processing.md) - Configure batch size for large catalogs
- [Cost Optimization](../advanced/cost-optimization.md) - Reduce translation expenses

**Handle Issues:**
- [Common Errors](../troubleshooting/common-errors.md) - Solutions to frequent problems
- [WPML Integration](../wpml-integration/wpml-basics.md) - Deep dive into WPML workflow

---

## Quick Reference

**Navigation:**
- `Tab` / `Shift+Tab` - Move between fields
- `Enter` - Activate/select
- `Ctrl+Enter` or `Ctrl+J` - Submit step
- `Esc` - Cancel/go back
- `s` - Open Settings
- `q` - Quit

**Files:**
- Input: Your WooCommerce export CSV
- Output: `[filename]_translated_[language].csv`
- Location: Default is `~/Downloads` (configurable)

**Support:**
- Report issues: [GitHub Issues](https://github.com/ashesofphoenix/wootui/issues)
- Ask questions: [GitHub Discussions](https://github.com/ashesofphoenix/wootui/discussions)

Happy translating! 🚀
