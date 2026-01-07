---
sidebar_position: 3
---

# Model Selection

Choose between Gemini Pro and Flash models based on your needs.

## Available Models

### gemini-2.5-pro (Default)
**Best for**: Quality over speed

**Pros**:
- Highest translation quality
- Better context understanding
- More natural phrasing

**Cons**:
- Slower (~2x vs flash)
- More expensive (~5x vs flash)

**Cost**: ~$1.00 per 1M tokens

**Use when**: Quality matters (customer-facing content, SEO meta, brand names)

---

### gemini-2.5-flash
**Best for**: Speed and cost savings

**Pros**:
- Much faster (~2x speed)
- Much cheaper (~5x cheaper)
- Still good quality for simple content

**Cons**:
- Slightly less natural phrasing
- May miss nuance in complex descriptions

**Cost**: ~$0.20 per 1M tokens

**Use when**: Large catalogs, simple products, budget constraints

---

## Cost Comparison

**Example**: 100 products with detailed descriptions

| Model | Cost | Time |
|-------|------|------|
| gemini-2.5-pro | $0.15-0.30 | ~3 min |
| gemini-2.5-flash | $0.03-0.06 | ~1.5 min |

---

## How to Change Model

1. Press `s` to open Settings
2. Navigate to "Model ID" field
3. Select `gemini-2.5-pro` or `gemini-2.5-flash`
4. Press `Enter` to save

---

## Recommendations

### Use gemini-pro for:
- Customer-facing product descriptions
- SEO meta titles and descriptions
- Brand-sensitive content
- First translation (validate quality)

### Use gemini-flash for:
- Internal product notes
- Large catalog bulk translations
- Simple product specifications
- Re-translations after validating with pro

### Mix Strategy:
1. Translate 10 products with pro
2. Validate quality
3. If acceptable, switch to flash for remaining 990 products
4. Manually review flash translations

---

## Next Steps

- [Cost Optimization](../advanced/cost-optimization.md) - Reduce translation costs
- [Batch Processing](../workflows/batch-processing.md) - Optimize speed
