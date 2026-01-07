---
sidebar_position: 4
---

# Output Directories

Configure where WooTUI saves translated CSV files.

## Default Location

**Default**: `~/Downloads` (or `C:\Users\YourName\Downloads` on Windows)

All translated files are saved with format:
```
[original-filename]_translated_[language].csv
```

**Example**:
- Input: `products.csv`
- Output: `products_translated_es.csv` (Spanish)

---

## Change Output Directory

1. Press `s` to open Settings
2. Navigate to "Output Directory"
3. Enter full path (e.g., `/Users/you/Documents/Translations`)
4. Press `Enter` to save

**Path format**:
- macOS/Linux: `/Users/yourname/Documents/WooTUI`
- Windows: `C:\Users\YourName\Documents\WooTUI`

---

## Organization Tips

### Create Dedicated Folder
```
~/Documents/WooTUI-Translations/
  ├── 2025-01-15-spanish/
  ├── 2025-01-20-french/
  └── backups/
```

### Date-based Naming
Manually rename outputs with dates:
- `products_es_2025-01-15.csv`
- `products_fr_2025-01-20.csv`

### Cloud Sync
Point output directory to Dropbox/iCloud folder for automatic backup.

---

## Troubleshooting

### "Permission Denied" Error

**Solution**: Choose a directory you have write access to (avoid system folders).

### File Not Found After Translation

**Solution**:
1. Check Settings → Output Directory for current location
2. Press `o` in Results screen to open folder
3. Search your system for `*_translated_*.csv` files

---

## Next Steps

- [First Translation](../getting-started/first-translation.md) - Start translating
