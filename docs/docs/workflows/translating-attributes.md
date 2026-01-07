---
sidebar_position: 2
---

# Translating Attributes

Learn how to translate WooCommerce product attributes for variable products (sizes, colors, materials, etc.).

## When You Need This

Translate attributes when:
- You have variable products (different sizes, colors, etc.)
- Products use custom attributes (material, brand, season)
- Customers need to filter by translated attribute values

**Example**: A t-shirt with Size (Small, Medium, Large) and Color (Red, Blue, Green) attributes should show Tamaño (Pequeño, Mediano, Grande) and Color (Rojo, Azul, Verde) in Spanish.

---

## How WooCommerce Attributes Work

WooCommerce stores attributes in **4 columns per attribute**:

1. `Attribute X Name` - Attribute label (e.g., "Color")
2. `Attribute X Value(s)` - Attribute values (e.g., "Red, Blue, Green")
3. `Attribute X Visible` - Show on product page (1/0)
4. `Attribute X Default` - Default variation selection

**Example in CSV**:
```
Attribute 1 Name,Attribute 1 Value(s),Attribute 1 Visible,Attribute 1 Default
Color,"Red, Blue, Green",1,Red
```

:::tip Auto-Detection
WooTUI automatically detects all attribute columns when you import your CSV. Just check the boxes for attributes you want to translate!
:::

---

## Quick Steps

1. **Export products** with all columns (including attributes)
2. **Launch WooTUI** and select your CSV
3. **Step 2 (Column Selection)**: Check attribute columns you want to translate
4. **Select target language** and translate
5. **Import** - WooTUI handles attribute name mapping automatically

---

## What Gets Translated

### Attribute Names
`Color` → `Color` (Spanish: Color)
`Size` → `Tamaño`
`Material` → `Material`

### Attribute Values
`Red, Blue, Green` → `Rojo, Azul, Verde`
`Small, Medium, Large` → `Pequeño, Mediano, Grande`

### Generated Column
WooTUI automatically creates `Meta: _wpml_import_wc_local_attribute_labels` which maps:
```
color:Color|size:Tamaño|material:Material
```

This tells WPML how to display attribute names in each language.

---

## Common Issues

### Attributes Show in English After Import

**Problem**: Product page shows "Color" instead of "Color" (Spanish)

**Cause**: WPML attribute label column not generated or imported correctly

**Solution**:
1. Verify output CSV has `Meta: _wpml_import_wc_local_attribute_labels` column
2. Re-import CSV with "Update existing products" enabled
3. Clear cache and check again

### Some Attribute Values Not Translated

**Problem**: "Red, Blue" translates but "Green" doesn't

**Cause**: CSV formatting issue (extra spaces, wrong delimiter)

**Solution**:
- Ensure values are comma-separated: `Red, Blue, Green` (not semicolons)
- Check for extra spaces or special characters
- Verify source CSV has consistent formatting

### Variable Products Lost After Import

**Problem**: Variable products become simple products

**Cause**: Attribute columns not mapped correctly during import

**Solution**:
1. During WooCommerce import, verify attribute columns map to correct fields
2. **Don't** import translated attribute names as new products
3. Use "Update existing products" (not "Create new products")

---

## Best Practices

### 1. Translate Global Attributes in WordPress First
If you use **global attributes** (managed in Products → Attributes), translate them in WordPress admin **before** exporting:
- Go to **Products → Attributes** → Edit attribute → Translate with WPML
- Then export and translate product data with WooTUI

This ensures consistency across all products.

### 2. Test with One Variable Product
Before translating 100 variable products:
- Export one variable product
- Translate with WooTUI
- Import and verify variations work correctly
- Check attribute filters on product archives

### 3. Keep Attribute Values Consistent
Don't use:
- ❌ "Red", "red", "RED" (inconsistent casing)
- ❌ "Small", "S", "Sm" (mixed formats)

Use:
- ✅ "Red", "Blue", "Green" (consistent)
- ✅ "Small", "Medium", "Large" (consistent)

Inconsistent values won't match after translation!

---

## Next Steps

- [SEO Meta Translation](./seo-meta-translation.md) - Optimize search visibility
- [Batch Processing](./batch-processing.md) - Handle large catalogs efficiently
