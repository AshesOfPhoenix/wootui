---
sidebar_position: 5
---

# Handling Existing Translations

Choose whether to skip or override existing translations when products already have translations in WPML.

## Override vs Skip

In Step 3 (Target Languages), you'll see: **"Override existing translations"** checkbox

### Skip (Default - Unchecked)
- Only translates products that **don't** have translations yet
- Preserves existing manual translations
- Safer for incremental updates

### Override (Checked)
- **Replaces all** existing translations for selected products
- Use when updating outdated translations
- Use when fixing translation errors

---

## When to Skip (Default)

Use skip when:
- ✅ Adding new products to catalog
- ✅ First translation of new languages
- ✅ You have manual translations you want to keep
- ✅ Translating only untranslated products

**Example**: You have 100 products, 50 already translated to Spanish. Skip will only translate the remaining 50.

---

## When to Override

Use override when:
- ✅ Updating old AI translations with better quality
- ✅ Fixing translation errors across all products
- ✅ Product descriptions changed and translations are outdated
- ✅ Switching translation style or terminology

:::caution Backup First
Override replaces ALL translations. Export your current translations as backup before using override!
:::

---

## How WooTUI Detects Existing Translations

WooTUI checks WPML columns in your CSV:
- `Meta: _wpml_import_language_code` - If this has a value (e.g., "es"), product has a translation
- `Meta: _wpml_import_translation_group` - Links source product to translations

**Example CSV**:
```
ID,Name,Meta: _wpml_import_language_code
123,T-Shirt,       (empty = source product)
124,Camiseta,es    (Spanish translation exists)
```

If `es` translation exists and skip is enabled, WooTUI won't re-translate product 123 to Spanish.

---

## Common Scenarios

### Scenario 1: Adding New Products
**Situation**: You added 20 new products, already have 100 translated

**Setting**: Skip (default)

**Result**: Only the 20 new products get translated

---

### Scenario 2: Updating Descriptions
**Situation**: You improved English descriptions, need to update translations

**Setting**: Override enabled

**Result**: All products re-translated with new descriptions

---

### Scenario 3: Mixing Manual + AI Translations
**Situation**: 10 products manually translated (high quality), 90 need AI

**Setting**: Skip (default)

**Result**: AI translates only the 90 products, keeps your 10 manual translations

---

### Scenario 4: Fixing Bad Translations
**Situation**: Previous AI run had poor quality, need to re-translate

**Setting**: Override enabled

**Result**: All products re-translated, replaces old translations

---

## Best Practices

### 1. Always Test with Override Disabled First
Run a small test (5-10 products) with skip enabled to:
- Verify translation quality
- Check what products get translated
- Confirm cost estimates

Then decide whether to use override for full catalog.

### 2. Backup Before Override
Before enabling override:
1. Export current products with translations
2. Save CSV as backup: `products_backup_YYYYMMDD.csv`
3. If something goes wrong, you can re-import the backup

### 3. Use Override Selectively
Don't need to override everything? Filter your CSV:
1. Open in Google Sheets
2. Filter to products that need updating
3. Export filtered rows
4. Translate with override enabled

Only those products get replaced.

---

## Common Issues

### Override Didn't Work

**Problem**: Enabled override but old translations still appear

**Solution**:
1. Verify translated CSV has language code column populated
2. Re-import with "Update existing products" enabled
3. Clear WooCommerce and WPML cache
4. Check WPML translation status in admin

### Some Products Skipped Unexpectedly

**Problem**: Products you expected to translate were skipped

**Cause**: Products have existing translations you didn't know about

**Solution**:
1. Check WPML → Translation Management for hidden translations
2. Export products and check `_wpml_import_language_code` column
3. Enable override if you want to replace those translations

---

## Next Steps

- [WPML Basics](../wpml-integration/wpml-basics.md) - Understand WPML integration
- [Importing Translations](../wpml-integration/importing-translations.md) - Import best practices
