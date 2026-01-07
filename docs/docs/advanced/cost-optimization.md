---
sidebar_position: 1
---

# Cost Optimization

Reduce translation costs by optimizing batch size and model selection.

## Batch Size Affects Cost

**Larger batches = Fewer API requests = Lower cost**

When you increase batch size:
- TOON format overhead (structure) is shared across more products
- Fewer API requests needed overall
- More token-efficient encoding

**Example**:
- Batch size 5: 100 products = 20 requests
- Batch size 10: 100 products = 10 requests

Fewer requests can mean slightly lower total token usage due to shared overhead.

---

## Other Cost Strategies

### Use gemini-flash for Simple Content
Switch to `gemini-2.5-flash` for ~5x cost reduction when translating simple products.

See [Model Selection](../configuration/model-selection.md).

### Translate Only Essential Columns
Skip attributes, SEO meta, or tags if not needed. Fewer columns = fewer tokens.

---

:::info More Coming Soon
This section will be expanded with detailed cost analysis, ROI calculations, and advanced strategies in future updates.
:::

---

## Next Steps

- [Batch Processing](../workflows/batch-processing.md) - Configure batch size
- [Model Selection](../configuration/model-selection.md) - Choose the right model
