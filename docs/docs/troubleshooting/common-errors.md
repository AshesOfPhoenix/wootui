---
sidebar_position: 1
---

# Common Errors

Solutions to frequent issues when using WooTUI.

## API Key Errors

### "Invalid API key"

**Problem**: WooTUI won't start or fails during translation

**Solutions**:
1. Open Settings (`s`) and verify API key is entered correctly
2. Ensure key starts with `AIza` with no extra spaces
3. Check key is enabled in [Google AI Studio](https://ai.google.dev)
4. Try regenerating your API key

### "API key not configured"

**Problem**: Settings screen shows empty API key field

**Solution**:
1. Get API key from Google AI Studio
2. Paste into API Key field
3. Press `Enter` to save
4. Press `Esc` to return to Main Screen

See [Gemini API Setup](../configuration/gemini-api-setup.md) for detailed steps.

---

## CSV Parsing Errors

### "Failed to parse CSV"

**Problem**: WooTUI can't read your CSV file

**Causes & Solutions**:

**Encoding Issue**:
- Open CSV in text editor
- Save as UTF-8 (not ANSI or ISO-8859-1)
- Re-import to WooTUI

**Wrong Delimiter**:
- CSV uses semicolons `;` instead of commas `,`
- Open in Excel/Google Sheets
- Export as CSV (comma-delimited)

**Corrupted File**:
- Re-export from WooCommerce
- Don't edit CSV in Excel (use Google Sheets or LibreOffice)

### "Missing required columns"

**Problem**: CSV doesn't have WPML columns

**Solution**:
1. Verify WPML is installed and active
2. Re-export ensuring "All columns" is selected
3. Check export includes `Meta: _wpml_import_*` columns

---

## Translation Errors

### "Translation failed"

**Generic error** - check specific cause:

**Too Many Requests**:
- You hit API rate limit (15 requests/min on free tier)
- **Solution**: Wait 1 minute and retry, or reduce batch size to 3-5

**Model Not Found**:
- Model ID is incorrect or model doesn't exist
- **Solution**: Open Settings, set Model ID to `gemini-2.5-pro`

**Token Limit Exceeded**:
- Product descriptions too long for single request
- **Solution**: Reduce batch size to 3, or split CSV into smaller files

**Network Error**:
- Internet connection lost during translation
- **Solution**: Check connection and retry

---

## Output File Errors

### "Permission denied"

**Problem**: Can't save translated CSV to output directory

**Solutions**:
1. Check output directory exists and is writable
2. Change output directory to `~/Documents` (Settings → Output Directory)
3. Run WooTUI with proper permissions (don't use `sudo` on Mac/Linux)

### "File already exists"

**Problem**: Output file is open in another program

**Solution**:
- Close the CSV file (Excel, Google Sheets, etc.)
- Retry translation
- Or choose different output directory

---

## General Troubleshooting Steps

If you encounter any error:

1. **Check Settings**:
   - API key is entered correctly
   - Model ID is `gemini-2.5-pro` or `gemini-2.5-flash`
   - Batch size is 3-10 (not 0 or 100)

2. **Verify CSV Format**:
   - UTF-8 encoding
   - WPML columns present
   - No corrupted rows

3. **Test with Small Sample**:
   - Export 1-2 products only
   - Try translating
   - Isolate the problem

4. **Read Error Messages**:
   - WooTUI shows specific error details
   - Look for API error codes, file paths, column names

5. **Restart WooTUI**:
   - Quit (`q` or `Ctrl+C`)
   - Relaunch `wootui`
   - Try again

---

## Getting Help

If errors persist:

1. **Check GitHub Issues**: [github.com/ashesofphoenix/wootui/issues](https://github.com/ashesofphoenix/wootui/issues)
2. **Open New Issue**: Include error message, CSV sample (without sensitive data), WooTUI version
3. **Provide Details**: OS, WooCommerce version, WPML version, steps to reproduce

---

## Next Steps

- [CSV Format Issues](./csv-format-issues.md) - Fix CSV encoding and formatting
- [WPML Integration](../wpml-integration/wpml-basics.md) - Understand WPML workflow
