---
sidebar_position: 4
---

# Batch Processing

Configure batch size to optimize translation speed and handle large product catalogs efficiently.

## What is Batch Processing?

WooTUI translates products in **batches** (groups of products processed together). This optimizes:
- Token efficiency (TOON format overhead is shared)
- API rate limit management
- Progress tracking

**Default batch size**: 5 products per batch

---

## When to Adjust Batch Size

### Increase Batch Size (10-20)
Use larger batches for:
- ✅ Simple products (short descriptions, no attributes)
- ✅ Fast API responses
- ✅ Paid Gemini API tier (higher rate limits)

**Benefits**: Faster translation, better token efficiency

### Decrease Batch Size (3-5)
Use smaller batches for:
- ✅ Complex products (long descriptions, many attributes)
- ✅ Free API tier (rate limit: 15 requests/minute)
- ✅ Variable products with multiple attributes

**Benefits**: Avoid rate limits, more stable processing

---

## How to Configure

1. Press `s` to open Settings
2. Navigate to "Batch Size" field
3. Enter desired batch size (3-20)
4. Press `Enter` to save

**Recommended values**:
- Simple products: 10-15
- Detailed products: 5-8
- Very complex products: 3-5

---

## Common Issues

### "Too Many Requests" Error

**Problem**: Translation stops with rate limit error

**Solution**:
1. Wait 1 minute
2. Reduce batch size to 3-5
3. Restart translation
4. Or upgrade to paid Gemini API tier

### Translation Takes Too Long

**Problem**: Large catalog takes hours to translate

**Solution**:
- Increase batch size to 15-20 (if no rate limit errors)
- Use gemini-flash model (faster, cheaper)
- Split catalog into multiple CSVs and translate separately

---

## Next Steps

- [Handling Existing Translations](./handling-existing-translations.md) - Override strategies
