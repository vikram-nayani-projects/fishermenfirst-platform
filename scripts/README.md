# Scripts Directory

This directory contains utility scripts for database operations, testing, and development.

## Key Scripts

### Production/Testing
- `create-test-data-final.js` - Creates test data with correct schema (USE THIS ONE)
- `test-after-sql.js` - Tests TEM calculations after data creation

### Development/Discovery (Historical)
- `discover-structure.js` - Schema discovery tool
- `check-schema.js` - Validates table structure
- `debug-calculation.js` - Debugging TEM calculation issues

### Archived/Experimental
All other scripts were used during development to discover the correct table structure and are kept for reference.

## Usage

```bash
# Create test data
node scripts/create-test-data-final.js

# Test calculations
node scripts/test-after-sql.js
```

## Note
Most scripts require SUPABASE_SERVICE_ROLE_KEY in .env.local for full database access.