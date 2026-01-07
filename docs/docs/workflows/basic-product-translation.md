---
sidebar_position: 1
---

# Basic Product Translation

Learn how to translate your complete WooCommerce product catalog with best practices for quality, cost, and efficiency.

## When to Use This Workflow

Use basic product translation when you need to:
- Translate your entire product catalog to new markets
- Launch a multilingual store for the first time
- Update translations for core product information
- Add new products that need immediate translation

This workflow covers **essential product fields** that customers see on your store:
- Product names
- Short descriptions (summaries)
- Full descriptions (detailed content)
- Optional: Tags and categories

---

## Quick Start

**Minimum columns to translate**: Name + Short Description + Description

**Typical cost**: $0.001 - $0.003 per product

**Time**: ~1 minute per 10 products

**Workflow**:
1. Export products from WooCommerce (with WPML columns)
2. Launch WooTUI → Select CSV → Choose columns → Pick language
3. Review cost → Translate → Import back to WooCommerce

---

## Recommended Column Selection

### Always Translate
- ✅ **Name** - Product title (critical for SEO)
- ✅ **Short Description** - Summary on listing pages
- ✅ **Description** - Full product details

### Skip for Now (Can Add Later)
- ⬜ Attributes - Only if needed for variations
- ⬜ SEO Meta - See [SEO Meta Translation](./seo-meta-translation.md)
- ⬜ Tags/Categories - Usually managed in WordPress separately

:::tip Start Simple
For your first run, just translate Name + Descriptions. You can run additional translations for other columns later.
:::

---

## Best Practices

### 1. Test with 5-10 Products First
Don't translate your entire catalog immediately:
- Verify translation quality
- Check the import process
- Ensure HTML formatting is preserved
- Confirm costs match expectations

### 2. Clean Source Content Before Translating
Fix typos, remove placeholders, and ensure descriptions are complete in your source language first. **AI translations are only as good as the source content.**

### 3. Review Output CSV Before Importing
Open the translated CSV in Google Sheets or LibreOffice (not Excel - it breaks UTF-8 encoding). Spot-check:
- Product names look natural
- HTML tags are intact (`<strong>`, `<ul>`, `<li>`)
- No garbled characters

### 4. Use One Language First
Start with your primary target market (e.g., Spanish for US, French for Canada). Validate quality before translating to multiple languages.

---

## Cost Breakdown

**Typical costs with gemini-2.5-pro**:
- Simple products: $0.0005 - $0.001 per product
- Detailed products: $0.001 - $0.003 per product

**Example**: 100 products with detailed descriptions ≈ $0.10 - $0.30

**Compare to manual translation**: Professional rates are $20-125 per product. WooTUI is **10,000x cheaper**.

:::tip Save Money
- Use gemini-flash for simple content (cheaper)
- Translate only essential columns
- Batch multiple languages in one run

See [Cost Optimization](../advanced/cost-optimization.md) for more strategies.
:::

---

## Common Issues

### Translations Look Too Generic

**Problem**: AI-generated text feels robotic or lacks context

**Solution**: Add more detail to source descriptions. Instead of:
- ❌ "Cotton t-shirt"
- ✅ "Soft organic cotton t-shirt, perfect for everyday wear with breathable fabric"

### HTML Tags Broken

**Problem**: Formatting is lost or tags appear in output

**Solution**:
- Simplify HTML in source products (use `<strong>`, `<em>` instead of complex styling)
- Review output CSV before importing
- Manually fix any broken tags

### Some Products Didn't Translate

**Problem**: Products are missing from translated CSV

**Possible causes**:
- Products already have translations (and "Override" was unchecked)
- Missing WPML columns in source CSV
- CSV parsing error

**Solution**:
- Check if products have existing translations in WPML
- Re-export CSV with all columns
- Enable "Override existing translations" if updating

---

## After Translation

### Import to WooCommerce

1. **WooCommerce → Products → Import**
2. Select `products_translated_es.csv`
3. Map columns (auto-detected)
4. **Important**: Enable "Update existing products" and match by ID/SKU
5. Run import
6. Clear cache and verify translations on frontend

See [Importing Translations](../wpml-integration/importing-translations.md) for detailed steps.

---

## Next Steps

**Translate more content**:
- [Translating Attributes](./translating-attributes.md) - Product variations
- [SEO Meta Translation](./seo-meta-translation.md) - Search optimization

**Handle issues**:
- [Batch Processing](./batch-processing.md) - Large catalogs
- [Handling Existing Translations](./handling-existing-translations.md) - Override vs skip
