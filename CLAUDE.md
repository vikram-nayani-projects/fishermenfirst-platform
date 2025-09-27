# spec_test Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-09-26

## Active Technologies
- TypeScript with Next.js 14+, Node.js 18+ + Next.js, Supabase (PostgreSQL + Auth), n8n, Tailwind CSS (001-fishermenfirst-analytics-platform)

## Project Structure
```
backend/
frontend/
tests/
```

## Commands
npm test; npm run lint

## Code Style
TypeScript with Next.js 14+, Node.js 18+: Follow standard conventions

## Recent Changes
- 001-fishermenfirst-analytics-platform: Added TypeScript with Next.js 14+, Node.js 18+ + Next.js, Supabase (PostgreSQL + Auth), n8n, Tailwind CSS

<!-- MANUAL ADDITIONS START -->

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

## User Access Rules

| User Type | TEM Access | Rockfish Access | Admin Access |
|-----------|------------|-----------------|--------------|
| Vessel | Own data only | Own data only | NO |
| TEM Manager | All TEM | NO | NO |
| Rockfish Manager | NO | All Rockfish | NO |
| Platform Admin | YES (Read-only) | YES (Read-only) | YES |

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
```

**YOU MUST:**
- Use parameterized queries
- Validate all inputs
- Log security events
- Test RLS policies

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

<!-- MANUAL ADDITIONS END -->