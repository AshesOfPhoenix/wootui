---
sidebar_position: 2
---

# Exporting from WooCommerce

Export your WooCommerce products with WPML columns ready for WooTUI translation.

## Quick Steps

1. **WooCommerce → Products → Export**
2. Select **"All columns"** or ensure WPML columns are included
3. Leave filters empty (or filter as needed)
4. Click **"Generate CSV"**
5. Download the file

---

## Required Columns

Ensure your export includes:

### Core Product Columns
- ID
- SKU
- Name
- Description
- Short Description

### WPML Columns (Critical!)
- `Meta: _wpml_import_source_language_code`
- `Meta: _wpml_import_language_code`
- `Meta: _wpml_import_translation_group`

:::caution Missing WPML Columns?
If these columns don't appear in your export, WPML might not be active or configured. Check **WPML → Settings** to ensure WooCommerce integration is enabled.
:::

### Optional (But Recommended)
- All `Attribute X Name/Value` columns (for variable products)
- SEO meta columns (`Meta: rank_math_*` or `Meta: _yoast_wpseo_*`)
- Custom metadata you want to translate

---

## Export Options

### Export All Products
- ✅ Best for first translation
- ✅ Includes all existing translations
- ❌ Large file for big catalogs

### Export by Category/Tag
Use WooCommerce export filters to limit export:
- **Category**: "T-Shirts", "Accessories", etc.
- **Tags**: "New Arrivals", "Sale Items"
- **Date range**: Products created after X date

**Use when**: You only need to translate specific products.

### Export Untranslated Products Only
WooCommerce doesn't have a built-in filter for this. Workaround:
1. Export all products
2. Open CSV in Google Sheets
3. Filter where `Meta: _wpml_import_language_code` is empty
4. Export filtered rows as new CSV

---

## Common Issues

### "Download CSV" Button Doesn't Work

**Solution**:
- Try a different browser
- Disable browser extensions (ad blockers)
- Check PHP memory limit on server (increase to 256M+)

### CSV is Missing Products

**Cause**: WooCommerce export has a limit (~1000 products depending on server)

**Solution**:
1. Export in batches using date filters
2. Or export by category/tag
3. Translate each batch separately

### WPML Columns Have Wrong Language Codes

**Problem**: All products show `Meta: _wpml_import_language_code` as `en`

**Cause**: You exported translated products, not source products

**Solution**:
1. Go to WPML → WooCommerce Multilingual
2. Switch to source language view (e.g., English)
3. Export products again
4. Source products should have **empty** language code column

---

## Best Practices

### 1. Export All Columns First Time
Even if you don't need attributes or SEO fields now, include them. You might want to translate them later, and having the columns makes it easier.

### 2. Save Export Settings
Create a "Translation Export" preset:
- All columns
- No filters
- Save as template

Reuse for future exports.

### 3. Backup Exported CSV
Before translating, save a copy:
```
products_backup_2025-01-20.csv
```

If something goes wrong, you can start over.

### 4. Check File Encoding
Open CSV in a text editor and verify:
- Encoding: UTF-8 (not ANSI or ISO-8859-1)
- Delimiter: Comma `,` (not semicolon `;`)

Wrong encoding will cause import errors later.

---

## Next Steps

- [First Translation](../getting-started/first-translation.md) - Translate the exported CSV
- [Importing Translations](./importing-translations.md) - Import back to WooCommerce
