---
sidebar_position: 2
---

# CSV Format Issues

Fix CSV encoding, formatting, and column issues for successful translation.

## CSV Requirements

WooTUI expects:
- **Encoding**: UTF-8 (not ANSI, ISO-8859-1, or Windows-1252)
- **Delimiter**: Comma `,` (not semicolon `;`)
- **Line breaks**: LF or CRLF (not CR only)
- **WPML columns**: `Meta: _wpml_import_source_language_code`, `Meta: _wpml_import_language_code`, `Meta: _wpml_import_translation_group`

---

## Encoding Issues

### Garbled Characters (ñ, é, ü, etc.)

**Problem**: Special characters appear as `Ã±`, `Ã©`, or question marks

**Cause**: CSV not in UTF-8 encoding

**Solution**:

**Google Sheets (Recommended)**:
1. Upload CSV to Google Sheets
2. File → Download → Comma-separated values (.csv)
3. Google Sheets always exports UTF-8

**LibreOffice Calc**:
1. Open CSV in LibreOffice Calc
2. File → Save As
3. File type: "Text CSV (.csv)"
4. Character set: **Unicode (UTF-8)**
5. Field delimiter: `,` (comma)
6. Save

**Windows Notepad**:
1. Open CSV in Notepad
2. File → Save As
3. Encoding: **UTF-8**
4. Save

:::caution Don't Use Excel
Microsoft Excel often breaks UTF-8 encoding. Use Google Sheets or LibreOffice instead!
:::

---

## Missing WPML Columns

### "Missing required columns" Error

**Problem**: WooTUI needs WPML columns but they're not in CSV

**Solution**:

1. **Verify WPML is installed**:
   - Go to WordPress → Plugins
   - Check "WPML Multilingual CMS" and "WPML WooCommerce Multilingual" are active

2. **Check WPML WooCommerce integration**:
   - WPML → WooCommerce Multilingual
   - Ensure integration is enabled

3. **Re-export with all columns**:
   - WooCommerce → Products → Export
   - Select **"All columns"**
   - Download CSV
   - Open in text editor and verify columns starting with `Meta: _wpml_import_*` are present

---

## Attribute Column Issues

### Attribute Names or Values Not Translating

**Problem**: Attributes appear incorrectly after translation

**Causes & Solutions**:

**Inconsistent Formatting**:
```csv
# Bad - mixed delimiters
Attribute 1 Value(s)
"Red, Blue; Green"

# Good - consistent commas
Attribute 1 Value(s)
"Red, Blue, Green"
```

**Extra Spaces**:
```csv
# Bad
"Red , Blue , Green"

# Good
"Red, Blue, Green"
```

**Wrong Column Count**:
- Each attribute needs 4 columns: Name, Value(s), Visible, Default
- Missing columns will cause errors

---

## Empty vs NULL Values

### How WooTUI Handles Empty Fields

**Empty string** (`""`):
- Column exists but has no value
- WooTUI preserves as empty in translation

**NULL placeholder** (`NULL_columnName`):
- WooTUI uses this internally to maintain CSV structure
- You shouldn't see these in output (if you do, it's a bug)

:::tip Empty Fields
Empty fields in source CSV will remain empty in translated CSV. This is intentional—don't translate what doesn't exist!
:::

---

## Delimiter Issues

### Semicolon Delimiters

**Problem**: CSV uses `;` instead of `,`

**Solution**:
1. Open CSV in Google Sheets or LibreOffice
2. Import with semicolon delimiter
3. Export as CSV with comma delimiter

---

## Quotes and Escaping

### Broken Quotes in Descriptions

**Problem**: Product descriptions with quotes cause parsing errors

**CSV Standard**: Quotes inside quoted fields must be doubled

**Example**:
```csv
# Bad
Description
"This is a "premium" product"

# Good
Description
"This is a ""premium"" product"
```

**Solution**:
- Don't manually edit CSVs with complex quotes
- Let Google Sheets or LibreOffice handle escaping
- Or use a CSV validator tool

---

## Validating Your CSV

### Online Validators
- [CSVLint](https://csvlint.io/) - Check for formatting errors
- [CSV Validator](https://www.convertcsv.com/csv-validator-online.htm) - Detailed validation

### Manual Check
Open CSV in text editor (not Excel) and verify:
1. First line has column headers
2. Each row has same number of columns
3. Special characters display correctly
4. No random line breaks in middle of fields

---

## Best Practices

### 1. Always Use UTF-8
Before translating:
- Export from WooCommerce
- Open in Google Sheets
- Re-export as CSV (ensures UTF-8)

### 2. Don't Edit in Excel
Excel breaks:
- UTF-8 encoding
- Leading zeros in SKUs
- Date formats

Use Google Sheets or LibreOffice Calc instead.

### 3. Keep Backups
Before any CSV editing:
```
products_original_2025-01-20.csv
products_edited_2025-01-20.csv
```

### 4. Test with Small Sample
Before translating 1000 products:
- Extract 5 rows to test CSV
- Translate test CSV
- Verify format is correct
- Then translate full catalog

---

## Next Steps

- [Common Errors](./common-errors.md) - Other troubleshooting tips
- [Exporting from WooCommerce](../wpml-integration/exporting-from-woocommerce.md) - Export best practices
