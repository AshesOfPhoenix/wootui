---
sidebar_position: 2
---

# TOON Format

Understand why WooTUI uses TOON format for token-efficient AI translations.

## What is TOON?

TOON (Terse Object Notation) is a compact data format designed for AI processing. WooTUI uses it to encode product data before sending to Gemini.

**Library**: [@toon-format/toon](https://www.npmjs.com/package/@toon-format/toon)

---

## Why TOON Instead of JSON?

**Problem with JSON**: Repeats keys for every product

**JSON example** (inefficient):
```json
[
  {"name": "T-Shirt", "description": "Cotton tee"},
  {"name": "Jeans", "description": "Blue denim"},
  {"name": "Hat", "description": "Baseball cap"}
]
```

Keys `"name"` and `"description"` repeat 3 times = wasted tokens.

**TOON example** (efficient):
```toon
name|description
T-Shirt|Cotton tee
Jeans|Blue denim
Hat|Baseball cap
```

Keys appear once = significant token savings.

**Result**: For 100 products, TOON can save 20-30% tokens compared to JSON.

---

## The NULL Placeholder Problem

**Challenge**: CSV columns can be empty, but TOON needs values to maintain structure.

**WooTUI's solution**:
1. **Before translation**: Replace empty CSV values with `NULL_columnName` placeholders
2. **Send to Gemini**: TOON encodes products with placeholders intact
3. **After translation**: Remove `NULL_*` placeholders, restore empty values

**Why placeholders?**
- Preserves CSV structure (columns don't shift)
- Prevents AI from inventing content for empty fields
- Ensures translated CSV matches source CSV format

**Example**:
```csv
# Source CSV
Name,Short Description,Description
T-Shirt,,Detailed description

# Encoded for TOON
Name,Short Description,Description
T-Shirt,NULL_ShortDescription,Detailed description

# After translation & post-processing
Name,Short Description,Description
Camiseta,,Descripción detallada
```

Empty `Short Description` stays empty in translation.

---

## How It Works

**Encoding process**:
1. Extract translatable content from products
2. Replace empty values with NULL placeholders
3. Encode to TOON format
4. Send to Gemini API

**Decoding process**:
1. Receive TOON-formatted translations from Gemini
2. Decode back to structured data
3. Remove NULL placeholders (restore empty values)
4. Merge with original product data

**You don't see any of this** - WooTUI handles encoding/decoding automatically!

---

## Token Savings Example

**100 products with 10 columns each**:

| Format | Tokens | Savings |
|--------|--------|---------|
| JSON | ~50,000 | - |
| TOON | ~35,000 | 30% |

For large catalogs, TOON format significantly reduces cost.

---

## Next Steps

- [Cost Optimization](./cost-optimization.md) - More ways to save
- [Batch Processing](../workflows/batch-processing.md) - Optimize translation speed
