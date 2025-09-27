# CLAUDE.md - FishermenFirst Platform

## Project Overview
Analytics platform for Alaska fishery management. Two separate programs: TEM (pollock) and Rockfish.

## Tech Stack
- **Database/Backend:** Supabase (PostgreSQL + Auto-generated APIs)
- **API Layer:** Node.js + Express (for complex business logic only)
- **Frontend:** Next.js (Vercel)
- **Automation:** n8n
- **Marketing:** Squarespace

## Critical Constraints

**YOU MUST:**
- Keep TEM and Rockfish data completely separated
- Use `tem_` prefix for all TEM tables
- Use `rp_` prefix for all Rockfish tables
- NEVER allow cross-program data access
- Maintain audit trail for ALL data changes

## Directory Structure

```
/app
  /tem          # TEM portal ONLY
  /rockfish     # Rockfish portal ONLY
  /admin        # Platform admin ONLY
/api            # Only if complex logic needed
  /tem          # TEM calculations
  /rockfish     # Rockfish calculations
/lib
  /supabase     # Supabase client config
  /calculations # Business logic
  /types        # TypeScript types
```

## Database Commands

```bash
# Connect to Supabase
npx supabase db push
npx supabase db reset

# Run migrations
npx supabase migration new <name>
npx supabase migration up
```

## MVP Timeline

**TEM MVP** (Oct-Dec 2025):
- Data ingestion (n8n email parsing)
- 4-trip calculations
- Vessel & manager portals
- Invoice generation

**Rockfish MVP** (Feb-Mar 2026):
- Manual quota entry forms
- Real-time quota tracking
- Salmon bycatch monitoring
- Transfer management

## API Endpoints

### Supabase Auto-Generated APIs
```javascript
// Use Supabase client for basic CRUD
const { data } = await supabase
  .from('tem_pollock_landings')
  .select('*')
  .eq('vessel_id', vesselId)
```

### Custom Node.js Endpoints (if needed)
- `GET /api/tem/trip-average/:vesselId` - Complex 4-trip calculation
- `POST /api/rockfish/transfer/validate` - Transfer validation logic
- `GET /api/reports/council` - Complex report generation

## User Access Rules

| User Type | TEM Access | Rockfish Access | Admin Access |
|-----------|------------|-----------------|--------------|
| Vessel | Own data only | Own data only | NO |
| TEM Manager | All TEM | NO | NO |
| Rockfish Manager | NO | All Rockfish | NO |
| Platform Admin | YES (Read-only) | YES (Read-only) | YES |

## Key Calculations

### TEM 4-Trip Average
```javascript
// Vessels >= 60ft
function calculateAverage(trips) {
  let group = []
  trips.forEach(trip => {
    if (trip.pounds > 335000) {
      // Egregious - separate violation, skip
      return
    }
    group.push(trip)
    if (group.length === 4) {
      checkViolation(avg(group))
      group = []
    }
  })
  // Check partial group (min 2 trips)
  if (group.length >= 2) checkViolation(avg(group))
}

// Vessels < 60ft
// Group calendar days with 2+ deliveries
// Need 2 such days minimum for average
// A/B seasons separate, no carryover
```

### Rockfish Quota
```javascript
// Track: vessel_allocation - total_landings = remaining
// Monitor: vessel caps AND processor caps
// Transfers: MUST update both parties atomically
```

## Database Triggers

### TEM Landing Processing
```sql
CREATE TRIGGER tem_landing_trigger
AFTER INSERT ON tem_pollock_landings
EXECUTE FUNCTION process_tem_landing();
-- Routes to vessel size calculation
-- Checks MRA violations
-- Logs all runs
```

### Rockfish Quota Updates
```sql
CREATE TRIGGER rp_landing_trigger  
AFTER INSERT ON rp_rockfish_landings
EXECUTE FUNCTION update_rockfish_quotas();
-- Decrements quota immediately
-- Checks caps
-- Sends alerts if negative
```

### Data Corrections
```sql
CREATE TRIGGER correction_trigger
AFTER UPDATE ON tem_pollock_landings
WHEN (OLD.pounds != NEW.pounds)
EXECUTE FUNCTION handle_landing_correction();
-- Archives original
-- Triggers recalculation
-- Maintains audit trail
```

## Data Validation

### Input Rules
```javascript
// Landing validation
vessel_id: required, uuid, exists_in_vessels
pounds: required, integer, min:1, max:500000
landing_date: required, not_future, within_season
species_code: required, pattern:/^[A-Z]{3,4}$/

// Transfer validation
async validateTransfer(data) {
  // Check quota available
  // Check cap limits
  // Verify inter-coop rules
  // Return specific errors
}
```

### Database Constraints
```sql
ALTER TABLE tem_pollock_landings
ADD CHECK (pounds > 0),
ADD CHECK (landing_date <= CURRENT_DATE);

ALTER TABLE rp_quota_allocations
ADD CHECK (remaining >= 0);
```

## Security Implementation

### Row Level Security
```sql
-- Enable RLS on all tables
ALTER TABLE [all_tables] ENABLE ROW LEVEL SECURITY;

-- Vessels see own data only
CREATE POLICY vessel_access ON [table]
USING (vessel_id IN (
  SELECT vessel_id FROM participants 
  WHERE user_id = auth.uid()
));

-- Program isolation enforced
-- Platform admin read-only
```

### Site Security
```javascript
// Required headers
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000

// Rate limits
Login: 5/15min
API: 100/min
Export: 10/hour

// Data protection
- AES-256 at rest
- TLS 1.3 in transit
- No auto-deletion
- 90-day backups
```

**YOU MUST:**
- Use parameterized queries
- Validate all inputs
- Log security events
- Test RLS policies

## Data Entry Forms

### TEM Manager Forms
**NONE** - All data via email parsing

### Rockfish Manager Forms
**Manual Entry Required:**
```javascript
// Initial Allocations
{
  season_year: 2026,
  cooperative_id: selected,
  species: ['POP', 'Northern', 'Dusky'],
  pounds_allocated: [entered_amounts]
}

// Quota Transfers  
{
  from_vessel_id: dropdown,
  to_vessel_id: dropdown,
  species: dropdown,
  pounds: number,
  transfer_type: ['LEASE', 'PERMANENT', 'OVERAGE_COVER']
}
```

## Data Ingestion Paths

### Email Processing (Primary)
```bash
# n8n monitors these inboxes
tem-data@fishermenfirst.org
rockfish-data@fishermenfirst.org

# Whitelist senders
NMFS: *@noaa.gov
Managers: [defined list]
```

### Admin Manual Upload (Backup)
```javascript
// Admin Dashboard > Manual Upload
{
  program: 'TEM' | 'Rockfish',
  type: 'New' | 'Correction' | 'Historical',
  season: selected, // for historical
  file: uploaded,
  reason: required
}
// Historical imports: reference only, no invoices
```

## Calculation Triggers

### TEM (Real-time)
```sql
-- On tem_pollock_landings INSERT/UPDATE
-- Vessels ≥60ft: calculate_four_trip_average()
-- Vessels <60ft: calculate_calendar_day_total()
-- All: check_mra_violations()
```

### Rockfish (Real-time)
```sql
-- On rp_rockfish_landings INSERT
UPDATE rp_quota_allocations 
SET remaining = remaining - NEW.pounds

-- On rp_quota_transfers INSERT
-- Validate → Update both vessels → Audit

-- On allocation entry
-- Initialize quotas → Calculate caps
```

## Data Refresh Strategy

### Manual Refresh (Default)
```javascript
// TEM - All pages manual
// Rockfish - Manager pages manual
onClick={() => fetchData()}
Cache: 1 hour TEM, 24hr violations
```

### Auto-Refresh (Quota Only)
```javascript
// Rockfish vessel quota ONLY
supabase
  .from('rp_quota_allocations')
  .on('UPDATE', handleUpdate)
  .subscribe()
  
// 5-minute refresh interval
// <50 concurrent connections (free tier)
```

## File Storage & Error Handling

### Storage Rules
```bash
# ALL files stored on receipt
/[program]/[year]/[season]/originals/
/[program]/[year]/[season]/processed/
/[program]/[year]/[season]/errors/

# Status: received → processing → processed/error
```

### Retry Logic
```javascript
// Network errors: 3x retry (1m, 5m, 15m)
// Parse errors: 1x alternate parser
// Validation errors: No retry (human review)
// Business errors: No retry (log only)

// Critical: Store file FIRST, always
try {
  const fileId = await storage.upload(file)
  // Processing continues...
} catch {
  // IMMEDIATE admin alert
}
```

**File tracking table:**
```sql
file_storage_log (
  id, file_path, status, 
  error_message, retry_count
)
```

## Real-time Updates (Rockfish Only)

### Subscriptions
```javascript
// Vessel quota (vessel-specific)
supabase.channel('vessel-quotas')
  .on('postgres_changes', {
    event: 'UPDATE',
    table: 'rp_quota_allocations',
    filter: `vessel_id=eq.${vesselId}`
  }, handleQuotaUpdate)

// Salmon count (fleet-wide)
supabase.channel('salmon-fleetwide')
  .on('broadcast', {
    event: 'salmon-update'
  }, handleSalmonUpdate)

// Cap warnings (processor-specific)
// Trigger at 90% → Warning banner
```

### Connection Limits
- Max 50 concurrent (free tier)
- Rockfish quota pages only
- Auto-reconnect on failure
- Unsubscribe on navigation

**TEM uses NO real-time features**

## Environment Variables

**REQUIRED:**
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=  # Backend only
DATABASE_URL=          # Direct connection
```

## Security Rules

**YOU MUST:**
- Use Row Level Security for all tables
- Verify user permissions on EVERY request
- Encrypt sensitive data (prices, locations)
- Rate limit API endpoints
- Validate all inputs

## Testing Requirements

```bash
# Run before EVERY commit
npm test
npm run test:db     # Database constraints
npm run test:calc   # Business logic
npm run test:api    # API endpoints
```

## Deployment Commands

```bash
# Frontend (Vercel)
git push main  # Auto-deploys

# Backend (only if complex calcs needed)
railway up

# Database
npx supabase db push
npx supabase migration new
npx supabase migration up
```

## Critical Business Rules

**TEM Program:**
- 300,000 lb trip limit (4-trip average)
- MRA percentages from Table 10 CFR
- Fines escalate: $750, $1,500, $2,000, $2,500
- Egregious trips (>335,000 lbs) excluded from average

**Rockfish Program:**
- 1,200 Chinook salmon cap (extrapolated)
- Quota transfers require manager approval
- Inter-coop transfers affect processor delivery
- Caps prevent consolidation abuse

**NEVER:**
- Mix test and production data
- Skip audit logging
- Allow negative quotas
- Process data without validation
- Allow cross-program data access

## Error Handling

**ALWAYS:**
- Log errors with context
- Return user-friendly messages
- Preserve data integrity
- Notify admin for critical errors