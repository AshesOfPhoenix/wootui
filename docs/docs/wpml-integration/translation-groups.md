---
sidebar_position: 4
---

# Translation Groups

Understand how WPML translation groups link source products to their translations.

## What Are Translation Groups?

Translation groups are unique IDs that link a source product to all its translations.

**Example**:
```
Product ID 123 (English)   → Group: woocommerce_product_123
Product ID 456 (Spanish)   → Group: woocommerce_product_123
Product ID 789 (French)    → Group: woocommerce_product_123
```

All three products share the same group, so WPML knows they're translations of each other.

---

## Why They Matter

Translation groups enable:
- **Language switcher**: Clicking "Spanish" on English product takes you to Spanish version
- **Translation management**: WPML admin shows which products have translations
- **Inventory sync**: WPML can sync stock across translations (optional)
- **Relationship preservation**: Deleting source product can optionally delete translations

**Without correct groups**: Translations appear as separate unrelated products.

---

## How WooTUI Handles Groups

When you translate with WooTUI:

1. **Reads translation group** from source CSV (`Meta: _wpml_import_translation_group`)
2. **Preserves the group ID** for all translated products
3. **Writes group to output CSV** for each translation

**Result**: After import, WPML automatically links products correctly.

**You don't need to manually edit translation groups!**

---

## Group Format

**Format**: `woocommerce_product_[ID]`

**Where [ID]** is:
- The source product's WordPress Post ID
- **OR** a custom group ID you set

**Examples**:
- `woocommerce_product_123`
- `woocommerce_product_789`

:::tip Consistent Groups
All translations of a product must have the **exact same** translation group ID. WooTUI ensures this automatically.
:::

---

## Common Issues

### Translations Not Linked

**Problem**: Spanish and French versions show as separate products, not translations

**Cause**: Translation group IDs don't match

**Solution**:
1. Export products and check `Meta: _wpml_import_translation_group` column
2. Ensure all translations of a product have identical group IDs
3. Re-import if groups are mismatched

### Source Product Missing

**Problem**: Translation exists but source product deleted

**Result**: Translation becomes orphaned (no source)

**Solution**:
1. Re-import source product
2. Or delete orphaned translations via WPML → Translation Management

### Group ID Changed Unexpectedly

**Problem**: After re-import, products have different translation group IDs

**Cause**: WooCommerce assigned new Post IDs on import

**Solution**:
- Always import with "Update existing products" enabled
- Match by ID or SKU to preserve Post IDs
- Don't manually edit group IDs unless necessary

---

## When to Manually Edit Groups

**Rarely needed**, but use cases include:

### Merging Translation Groups
If you accidentally created duplicate products:
1. Open translated CSV
2. Change group IDs to match the correct product
3. Re-import

### Creating Custom Groups
For imported products from another system:
1. Assign custom group IDs: `woocommerce_product_custom_001`
2. Ensure all translations share the same custom ID

---

## Verifying Translation Groups

### In CSV
Open CSV and check:
```csv
ID,Name,Meta: _wpml_import_translation_group
123,T-Shirt,woocommerce_product_123
456,Camiseta,woocommerce_product_123
789,T-shirt,woocommerce_product_123
```

All three rows should have the same group ID.

### In WordPress Admin
1. Go to **WPML → WooCommerce Multilingual**
2. Find the source product
3. Click translation flags to see linked translations
4. All translations should be listed together

---

## Best Practices

### 1. Never Delete Translation Group Columns
Always include these columns in your CSV:
- `Meta: _wpml_import_source_language_code`
- `Meta: _wpml_import_language_code`
- `Meta: _wpml_import_translation_group`

Even if you don't translate them, WPML needs them for import.

### 2. Preserve Groups When Filtering
If you export a subset of products:
1. Ensure you include all translations of a product (not just source)
2. Keep translation group column intact
3. Don't split translations across multiple CSVs

### 3. Backup Before Group Changes
If manually editing translation groups:
1. Backup database first
2. Test with 1-2 products
3. Verify links work before doing full import

---

## Next Steps

- [Handling Existing Translations](../workflows/handling-existing-translations.md) - Update strategies
- [Importing Translations](./importing-translations.md) - Import best practices
