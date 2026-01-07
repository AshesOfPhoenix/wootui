---
sidebar_position: 3
---

# API Rate Limits

Handle Google Gemini API rate limits when translating large catalogs.

## Rate Limits

**Free tier**: 15 requests per minute

**Symptoms**:
- "Too Many Requests" error during translation
- Translation stops mid-batch
- 429 error code

---

## Current Solutions

### 1. Wait and Retry
Wait 1 minute, then restart translation. WooTUI will continue from where it left off.

### 2. Reduce Batch Size
Lower batch size to 3-5 products:
1. Press `s` to open Settings
2. Change Batch Size to 3
3. Retry translation

### 3. Upgrade API Tier
Upgrade to paid tier in Google Cloud Console for higher rate limits.

---

## Coming Soon: Automatic Request Throttling

:::info Future Feature
WooTUI will soon include a **timeout configuration** that automatically delays API requests to stay within rate limits. This will eliminate manual waiting and batch size adjustments.

**How it will work**:
- Configure delay between requests in Settings
- WooTUI spreads requests automatically
- No more rate limit errors on free tier

Stay tuned for updates!
:::

---

## Next Steps

- [Batch Processing](../workflows/batch-processing.md) - Optimize batch size
- [Common Errors](./common-errors.md) - Other troubleshooting tips
