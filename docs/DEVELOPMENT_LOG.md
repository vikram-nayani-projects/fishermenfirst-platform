# Development Log

This document tracks the key decisions, challenges, and solutions during the development of the Fishermen First Platform.

## Initial Requirements Analysis

**Date**: 2025-09-26
**Goal**: Create MVP data platform for Alaska TEM and Rockfish programs

### Key Regulatory Requirements Identified:
1. **TEM Program**: 4-trip averaging for vessels ≥60ft (max 300,000 lbs pollock average)
2. **Rockfish Program**: Quota management and salmon bycatch tracking
3. **User Management**: Role-based access for different stakeholder types
4. **Data Recovery**: Emergency upload capabilities for system failures

### Architecture Decisions:
- **Supabase over custom backend**: Real-time capabilities, built-in auth, faster development
- **Magic Links over passwords**: Better UX, reduces support burden
- **Direct Supabase calls over API layer**: Simpler for MVP, sufficient for current scale
- **Single platform with role separation**: More maintainable than separate TEM/Rockfish sites

## Major Development Phases

### Phase 1: Database Schema Discovery (Sept 26)
**Challenge**: Documentation didn't match actual table structure

**Problem**: Initial code assumed fields like `fish_ticket`, `gear_type` existed, but they didn't in the actual database.

**Solution**: Created iterative schema discovery scripts:
```javascript
// scripts/discover-structure.js
// scripts/check-schema.js
```

**Learning**: Always validate actual schema before writing application code.

### Phase 2: TEM Calculations Implementation
**Challenge**: "Vessel not found" errors in calculation function

**Root Cause**: Using anonymous key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) instead of service role key
```javascript
// Before (failed):
const supabase = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// After (works):
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY)
```

**Impact**: Calculations now work correctly, compliance tracking functional

### Phase 3: Test Data Creation
**Iteration Process**:
1. **Attempt 1**: Missing `processor_id` (NOT NULL constraint)
2. **Attempt 2**: Missing `code` field in processors table
3. **Attempt 3**: Missing `season` field
4. **Attempt 4**: Missing `season_year` field
5. **Success**: All required fields identified

**Final Required Fields**:
```sql
tem_pollock_landings: vessel_id, landing_date, delivery_date, pounds,
                     processor_id, season, season_year
processors: id, name, code, location
```

### Phase 4: Admin Interface Development
**Requirements**: User management + emergency data upload

**Key Components Built**:
- `/admin` - Dashboard with navigation
- `/admin/users` - User management with Magic Link invitations
- `/admin/upload` - CSV upload with validation and templates
- `/admin/emergency` - Direct SQL access and data export

**Security Considerations**:
- Admin-only access control
- Dangerous operation confirmations
- Service role key for full database access

## Technical Challenges & Solutions

### 1. Table Structure Mismatches
**Problem**: Schema documentation vs. reality
**Solution**: Built discovery scripts to probe actual structure
**Takeaway**: Always validate schema programmatically

### 2. Authentication Key Confusion
**Problem**: Anonymous vs. service role key usage
**Solution**: Use service role for backend operations, anon key for frontend
**Takeaway**: Document which key to use for each operation type

### 3. CSV Upload Validation
**Problem**: Need to validate data before database insert
**Solution**: Client-side validation with preview + server-side batch processing
**Features**: Template downloads, error reporting, rollback capability

## Current State

### ✅ Completed Features:
- TEM 4-trip calculation engine
- Test data creation and validation
- User management with Magic Links
- CSV data upload system
- Emergency admin tools
- Role-based access control foundation

### 🔄 In Progress:
- Row Level Security (RLS) policies
- Production deployment setup

### 📋 Planned:
- Real-time compliance dashboards
- Automated compliance alerts
- Integration with existing fishery data systems

## Key Files & Their Purpose

```
lib/tem-calculations.js     # Core TEM compliance logic
pages/admin/               # Admin interface components
scripts/create-test-data-final.js  # Working test data creation
sql/working-test-setup.sql # Manual SQL for Supabase dashboard
docs/MVP_DATA_MODEL.md     # Complete schema documentation
```

## Lessons Learned

1. **Schema First**: Always validate database schema before building application logic
2. **Iterative Discovery**: Use scripts to probe and understand existing systems
3. **Service vs. Anonymous Keys**: Be explicit about which Supabase key to use where
4. **Emergency Planning**: Admin tools for data recovery are critical for production systems
5. **Role-Based Design**: Design security model early, implement throughout

## Next Steps

1. Complete RLS policies for data security
2. Production deployment to app.fishermenfirst.org
3. User acceptance testing with real stakeholders
4. Integration planning with existing fishery data systems