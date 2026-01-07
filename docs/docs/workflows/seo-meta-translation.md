---
sidebar_position: 3
---

# SEO Meta Translation

Translate SEO meta fields (title, description, keywords) for better search visibility in each language.

## Supported SEO Plugins

WooTUI detects and translates SEO meta fields from:
- **Rank Math** - Most common, fully supported
- **Yoast SEO** - Similar column format

:::tip Check Your Plugin
Export a product and check for columns like `Meta: rank_math_title` or `Meta: _yoast_wpseo_title`. If present, WooTUI can translate them!
:::

---

## SEO Columns to Translate

### Rank Math Fields
- `Meta: rank_math_title` - SEO title (appears in search results)
- `Meta: rank_math_description` - Meta description (search snippet)
- `Meta: rank_math_focus_keyword` - Target keyword for ranking

### Why Translate SEO Meta

**Without translated SEO**: Spanish page shows English meta title/description in Google
**With translated SEO**: Spanish page shows localized meta that ranks better

**Example**:
- EN: "Organic Cotton T-Shirt | Eco-Friendly Apparel"
- ES: "Camiseta de Algodón Orgánico | Ropa Ecológica"

---

## Character Limits

Follow these limits for best results:

**Meta Title**: 50-60 characters
- Google truncates at ~60 characters
- Keep most important words at the beginning

**Meta Description**: 150-160 characters
- Google truncates at ~160 characters
- Include call-to-action and target keyword

**Focus Keyword**: 1-3 words
- Primary search term you want to rank for
- Should appear naturally in title and description

:::caution AI May Exceed Limits
Gemini doesn't always respect character limits. Review output CSV and manually trim long meta fields before importing.
:::

---

## Best Practices

### 1. Translate Keywords for Local Search
Don't directly translate English keywords. Research local search terms:
- ❌ EN: "organic cotton" → ES: "algodón orgánico" (literal)
- ✅ Research shows Spanish users search "algodón ecológico" more often

Use Google Keyword Planner or local search trends.

### 2. Maintain Keyword Consistency
If focus keyword is "organic cotton t-shirt":
- Include it in SEO title
- Use it in meta description
- Mention it in product description

Same for translated versions—keyword should appear across all SEO fields.

### 3. Avoid Duplicate Meta Descriptions
Each product should have unique meta descriptions. Generic descriptions hurt SEO.

Bad:
- Product A: "Buy quality t-shirts online"
- Product B: "Buy quality t-shirts online"

Good:
- Product A: "Organic cotton t-shirt in blue, perfect for summer"
- Product B: "Premium linen shirt with button-down collar"

---

## Common Issues

### Meta Fields Don't Appear After Import

**Problem**: Rank Math SEO fields missing from translated products

**Solution**:
1. Verify output CSV includes `Meta: rank_math_*` columns
2. Re-import with "Update existing products" enabled
3. Check Rank Math is active and configured for WPML

### Meta Descriptions Too Long

**Problem**: Descriptions exceed 160 characters and get truncated in search

**Solution**:
- Open translated CSV before importing
- Find long descriptions (use spreadsheet CHAR function)
- Manually trim to 150-160 characters
- Re-import

### Focus Keywords Not Ranking

**Problem**: Translated keywords don't improve search visibility

**Cause**: Direct translation doesn't match local search behavior

**Solution**:
- Use Google Trends to find popular local terms
- Research competitors' keywords in target language
- Update focus keywords in CSV before importing

---

## Next Steps

- [Batch Processing](./batch-processing.md) - Handle large catalogs
- [Handling Existing Translations](./handling-existing-translations.md) - Update strategies
