---
sidebar_position: 3
---

# Importing Translations

Import your WooTUI-translated CSV back into WooCommerce to activate translations.

## Quick Steps

1. **WooCommerce → Products → Import**
2. **Choose translated CSV** (e.g., `products_translated_es.csv`)
3. Click **"Continue"**
4. **Map columns** (usually auto-detected)
5. **Select "Update existing products"** (important!)
6. **Match by ID or SKU**
7. Click **"Run the importer"**
8. Wait for import to complete
9. **Clear cache** and verify translations

---

## Import Options (Step 3)

### Update Existing Products ✅
**REQUIRED** - You must enable this!

This tells WooCommerce to update products instead of creating duplicates.

### Match Products By
**ID** (recommended) or **SKU**

Both work, but ID is more reliable.

---

## Column Mapping (Step 2)

WooCommerce should auto-map most columns. Verify:

### Must Be Mapped
- `ID` → ID
- `Name` → Name
- `Description` → Description
- `Short Description` → Short description
- `Meta: _wpml_import_*` → Custom meta fields

### Don't Map
Skip these columns during import:
- `Published`, `Featured` (would overwrite source products)
- `Images` (unless you want to update them)
- Any columns you didn't translate

:::tip Custom Meta Columns
Columns starting with `Meta:` should map to "Custom meta" or specific field names. WooCommerce usually detects these automatically.
:::

---

## After Import

### 1. Verify Import Success
Check the import summary:
```
Updated: 50 products
Skipped: 0
Failed: 0
```

If products were skipped or failed, review error messages.

### 2. Clear Caches
After importing:
- **WooCommerce cache**: WooCommerce → Status → Tools → Clear transients
- **WPML cache**: WPML → Support → Troubleshooting → Clear cache
- **Page cache**: If using WP Rocket, W3 Total Cache, etc., clear cache

### 3. Check Translations in Admin
1. Go to **Products → All Products**
2. Find a translated product
3. Check language flags (should show source + translations)
4. Click flag icon to view translated version

### 4. Verify on Frontend
1. Visit product page
2. Switch language using language switcher
3. Verify translated content appears
4. Check product variations (if applicable)

---

## Common Issues

### "Product Already Exists" Error

**Problem**: Import creates duplicate products instead of updating

**Solution**:
1. Make sure **"Update existing products"** is enabled
2. Verify CSV has ID or SKU column matching existing products
3. Choose "Match by ID" or "Match by SKU"
4. Re-import

### Translations Don't Show on Frontend

**Problem**: Import succeeded but translations not visible

**Solutions**:
1. Clear all caches (WooCommerce, WPML, site cache)
2. Go to WPML → WooCommerce Multilingual → Troubleshooting → Sync products
3. Check WPML → Languages to ensure target language is active
4. Verify translated products have correct language code in WPML

### Attributes Lost After Import

**Problem**: Variable products become simple products

**Solution**:
1. Re-export products ensuring all `Attribute X Name/Value/Visible/Default` columns are included
2. Re-translate with WooTUI
3. During import, verify attribute columns are mapped correctly
4. Import with "Update existing products" enabled

### Some Products Not Updated

**Problem**: Only some products imported successfully

**Cause**: ID or SKU mismatch between CSV and existing products

**Solution**:
1. Open translated CSV and verify IDs/SKUs match WooCommerce
2. Check for typos in SKU column
3. Ensure products exist in WooCommerce before importing translations

---

## Best Practices

### 1. Test with 5-10 Products First
Before importing 500 products:
1. Filter CSV to 5-10 products
2. Import test batch
3. Verify translations work correctly
4. Then import full catalog

### 2. Backup Database Before Import
Create a full site backup before large imports:
```bash
# Via plugin: UpdraftPlus, BackupBuddy, etc.
# Or manual: Export database via phpMyAdmin
```

If something goes wrong, restore and try again.

### 3. Import During Off-Peak Hours
Large imports can slow your site temporarily. Import when:
- Traffic is low
- You're available to monitor
- You can fix issues immediately

### 4. Keep Import File for Records
Save imported CSV with date:
```
products_translated_es_imported_2025-01-20.csv
```

Helps track what was translated and when.

---

## Next Steps

- [Translation Groups](./translation-groups.md) - Understand how WPML links translations
- [Handling Existing Translations](../workflows/handling-existing-translations.md) - Update strategies
