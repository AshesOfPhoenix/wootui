---
sidebar_position: 1
---

# WPML Basics

Understand how WooTUI integrates with WordPress Multilingual Plugin (WPML) for WooCommerce translations.

## What is WPML?

WPML is a WordPress plugin that manages multilingual content, including WooCommerce products. It:
- Links translated products together (translation groups)
- Manages language switchers on your site
- Handles URLs for each language (/es/product-name)
- Syncs product inventory across languages

**Required**: You need WPML + WooCommerce Multilingual installed to use WooTUI effectively.

---

## How WooTUI Fits In

**Traditional WPML workflow** (slow):
1. Manually translate each product in WordPress admin
2. Or hire translators
3. Or use WPML's built-in translation service ($$$)

**WooTUI workflow** (fast):
1. Export products from WooCommerce
2. Translate with WooTUI (AI, minutes, cheap)
3. Import back to WooCommerce
4. WPML automatically links translations

---

## Key WPML Concepts

### Translation Groups
Products in different languages are linked by a **translation group ID**.

**Example**:
```
Product A (English) - Group: woocommerce_product_123
Product A (Spanish) - Group: woocommerce_product_123
Product A (French)  - Group: woocommerce_product_123
```

All three products share the same group, so WPML knows they're translations of each other.

**WooTUI preserves these groups automatically.**

### Language Codes
ISO 639-1 language codes identify each language:
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German

These codes appear in CSV columns and URLs.

### Source Language
The original language your products are written in (usually English).

**In CSV**: Products with empty `Meta: _wpml_import_language_code` are source products.

---

## WPML CSV Columns

WooTUI requires these columns in your CSV:

### `Meta: _wpml_import_source_language_code`
The language code of the original product.

**Example**: `en` (English)

### `Meta: _wpml_import_language_code`
The language code of the translated product.

**Values**:
- Empty = source product
- `es` = Spanish translation
- `fr` = French translation

### `Meta: _wpml_import_translation_group`
Unique ID linking source and translations together.

**Format**: `woocommerce_product_[ID]`

**Example**: `woocommerce_product_789`

---

## What WooTUI Does Automatically

When you translate products, WooTUI:

1. **Reads WPML columns** from source CSV
2. **Translates product content** (names, descriptions, etc.)
3. **Sets language code** for translated products (e.g., `es`)
4. **Preserves translation group** IDs
5. **Generates attribute label mappings** (`_wpml_import_wc_local_attribute_labels`)
6. **Outputs WPML-ready CSV** for import

You don't need to manually edit WPML columns—WooTUI handles it!

---

## Common Questions

### Do I need WPML installed to use WooTUI?

**Technically no** - WooTUI works with any CSV. But to **import** the translated products back to WordPress, you need WPML.

### Can I use WooTUI with other multilingual plugins?

**Not directly**. WooTUI is designed for WPML's CSV format. Other plugins (Polylang, TranslatePress) have different structures.

### What if I don't have WPML yet?

1. Install WPML + WooCommerce Multilingual
2. Configure your languages in WPML settings
3. Export products (WPML columns will be included)
4. Use WooTUI to translate

### Does WooTUI support WPML String Translation?

**No**. WooTUI translates **product data** (names, descriptions). For UI strings (buttons, labels), use WPML String Translation directly.

---

## Next Steps

- [Exporting from WooCommerce](./exporting-from-woocommerce.md) - How to export with WPML columns
- [Importing Translations](./importing-translations.md) - Import translated CSV back
- [Translation Groups](./translation-groups.md) - Deep dive on how groups work
