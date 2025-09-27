# MVP Data Model: Fishery Management Platform

## Overview
This is the minimal viable product (MVP) data model focused on providing essential data services for TEM and Rockfish programs. All non-essential features have been removed to focus on core regulatory compliance requirements.

## Core MVP Requirements

### TEM Program
- **4-Trip Average Enforcement**: Vessels ≥60ft must average under 300,000 lbs pollock per 4 consecutive trips
- **Egregious Trip Tracking**: Trips over 335,000 lbs trigger additional penalties
- **Landing Data**: Basic trip and catch data for calculations

### Rockfish Program
- **Quota Management**: Track annual allocations and current balances
- **Quota Transfers**: Enable quota trading between entities
- **Salmon Bycatch Monitoring**: Track against annual fleet caps

## 7 Essential MVP Tables

### 1. users ✅ (EXISTS)
**Purpose**: User authentication and role-based access control
**Critical For**: Connecting Supabase Auth to business roles and vessel access
**Integration**: Works with Supabase Auth system for secure login/registration
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('vessel', 'tem_manager', 'rockfish_manager', 'admin')),
  vessel_id UUID REFERENCES vessels(id), -- Only for vessel users
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
```

### 2. vessels ✅ (EXISTS)
**Purpose**: Foundation table - vessel identification and basic info
**Critical For**: All programs require vessel identification
```sql
CREATE TABLE vessels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  length_feet INTEGER NOT NULL,
  vessel_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. tem_pollock_landings ✅ (EXISTS)
**Purpose**: Records every pollock delivery for TEM calculations
**Critical For**: 4-trip average calculations and compliance monitoring
```sql
CREATE TABLE tem_pollock_landings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id UUID REFERENCES vessels(id) NOT NULL,
  landing_date DATE NOT NULL,
  pounds INTEGER NOT NULL CHECK (pounds > 0),
  species_code TEXT NOT NULL DEFAULT 'POLL',
  landing_port TEXT,
  delivery_id TEXT,
  season_year INTEGER NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. tem_four_trip_calculations ✅ (EXISTS)
**Purpose**: Stores rolling 4-trip averages for compliance enforcement
**Critical For**: Core TEM business rule - prevents vessels from exceeding limits
```sql
CREATE TABLE tem_four_trip_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id UUID REFERENCES vessels(id) NOT NULL,
  calculation_date DATE NOT NULL,
  trip_group_start_date DATE NOT NULL,
  trip_group_end_date DATE NOT NULL,
  trip_count INTEGER NOT NULL CHECK (trip_count BETWEEN 1 AND 4),
  total_pounds INTEGER NOT NULL CHECK (total_pounds >= 0),
  average_pounds DECIMAL(10,2) NOT NULL CHECK (average_pounds >= 0),
  is_compliant BOOLEAN NOT NULL,
  is_egregious BOOLEAN NOT NULL DEFAULT FALSE,
  violation_threshold INTEGER DEFAULT 300000,
  egregious_threshold INTEGER DEFAULT 335000,
  season_year INTEGER NOT NULL,
  landing_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vessel_id, calculation_date),

  CONSTRAINT valid_average CHECK (
    ABS(average_pounds - (total_pounds::DECIMAL / trip_count)) < 0.01
  ),

  CONSTRAINT valid_compliance CHECK (
    (is_compliant = (average_pounds <= violation_threshold)) AND
    (is_egregious = (average_pounds > egregious_threshold))
  )
);

CREATE INDEX idx_tem_four_trip_vessel_date ON tem_four_trip_calculations(vessel_id, calculation_date);
CREATE INDEX idx_tem_four_trip_season ON tem_four_trip_calculations(season_year);
CREATE INDEX idx_tem_four_trip_compliance ON tem_four_trip_calculations(is_compliant, is_egregious);
```

### 5. rp_quota_allocations ✅ (EXISTS)
**Purpose**: Annual quota allocations by vessel and species
**Critical For**: Rockfish program quota management foundation
```sql
CREATE TABLE rp_quota_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id UUID REFERENCES vessels(id) NOT NULL,
  species_code TEXT NOT NULL,
  season_year INTEGER NOT NULL,
  initial_allocation INTEGER NOT NULL,
  current_allocation INTEGER NOT NULL,
  used_pounds INTEGER DEFAULT 0,
  remaining_pounds INTEGER GENERATED ALWAYS AS (current_allocation - used_pounds) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vessel_id, species_code, season_year)
);
```

### 6. rp_quota_transfers ✅ (EXISTS)
**Purpose**: Tracks quota movements between vessels
**Critical For**: Enables quota trading and overage resolution
```sql
CREATE TABLE rp_quota_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_vessel_id UUID REFERENCES vessels(id) NOT NULL,
  to_vessel_id UUID REFERENCES vessels(id) NOT NULL,
  species_code TEXT NOT NULL,
  pounds INTEGER NOT NULL CHECK (pounds > 0),
  season_year INTEGER NOT NULL,
  transfer_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'PENDING',
  notes TEXT,
  CONSTRAINT no_self_transfer CHECK (from_vessel_id != to_vessel_id)
);
```

### 7. rp_salmon_bycatch ✅ (EXISTS)
**Purpose**: Tracks salmon bycatch against fleet caps
**Critical For**: Regulatory compliance for salmon protection
```sql
CREATE TABLE rp_salmon_bycatch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id UUID REFERENCES vessels(id) NOT NULL,
  landing_date DATE NOT NULL,
  chinook_count INTEGER DEFAULT 0 CHECK (chinook_count >= 0),
  coho_count INTEGER DEFAULT 0 CHECK (coho_count >= 0),
  season_year INTEGER NOT NULL,
  fleet_total_chinook INTEGER,
  fleet_cap_chinook INTEGER DEFAULT 1200,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## MVP Status: 7/7 Tables Complete (100%)

### ✅ Existing Tables (7):
- `users` - User authentication and roles
- `vessels` - Vessel registry
- `tem_pollock_landings` - TEM trip data
- `tem_four_trip_calculations` - 4-trip average calculations
- `rp_quota_allocations` - Rockfish quotas
- `rp_quota_transfers` - Quota movements
- `rp_salmon_bycatch` - Bycatch monitoring

### ❌ Missing Critical Tables (0):
None - All MVP tables are complete!

## Tables Removed from Original Spec (Not MVP Critical):

### User Management (Now included in MVP):
- ✅ `users` - Essential for Supabase Auth integration
- ❌ `user_program_access` - Simplified into main users table

### Complex Compliance (Output data, not core input):
- `tem_violations` - Generated from calculations, not source data
- `tem_mra_violations` - Advanced compliance, not MVP critical

### Advanced Features (Nice-to-have, not essential):
- `vessel_program_participation` - Can be derived from landing data
- `tem_landing_corrections` - Can handle in main landings table
- `rp_pollock_landings` - TEM handles all pollock data
- `rp_species_config` - Can use simple text codes
- `rp_rockfish_landings` - Can combine with allocations for MVP
- `audit_logs` - Important but not blocking for MVP
- `file_storage_log` - File handling not core data service
- `season_configurations` - Can hardcode seasons for MVP

## Next Steps

1. **Create Missing Table**: Run the SQL above to create `tem_four_trip_calculations`
2. **Test Data Flow**: Verify all 6 tables work together
3. **Basic API**: Create simple endpoints for each table
4. **Core Calculations**: Implement 4-trip average logic

## MVP Success Criteria

The platform can successfully:
1. ✅ Store vessel information
2. ✅ Record TEM pollock landings
3. ❌ Calculate 4-trip averages (blocked by missing table)
4. ✅ Manage Rockfish quota allocations
5. ✅ Track quota transfers
6. ✅ Monitor salmon bycatch

## User Management Flow with Supabase Auth

### Authentication Strategy
- **Supabase Auth** handles secure login, registration, password management
- **Custom users table** handles business roles and vessel assignments
- **Row Level Security (RLS)** enforces data access based on user roles

### User Roles and Access

#### 1. Vessel Operators (`role: 'vessel'`)
- **Access**: Only their own vessel's data
- **Permissions**:
  - Submit landing data for their vessel
  - View their compliance status and calculations
  - View their quota allocations and transfers
- **Data Scope**: `WHERE vessel_id = user.vessel_id`

#### 2. TEM Managers (`role: 'tem_manager'`)
- **Access**: All TEM program data across all vessels
- **Permissions**:
  - View all pollock landings and 4-trip calculations
  - Calculate and review violations
  - Generate program reports
- **Data Scope**: All `tem_*` tables

#### 3. Rockfish Managers (`role: 'rockfish_manager'`)
- **Access**: All Rockfish program data across all vessels
- **Permissions**:
  - Manage quota allocations and transfers
  - Monitor salmon bycatch across fleet
  - Approve/reject quota transfer requests
- **Data Scope**: All `rp_*` tables

#### 4. Platform Admins (`role: 'admin'`)
- **Access**: All data across both programs
- **Permissions**:
  - Create and manage user accounts
  - System configuration and maintenance
  - Cross-program reporting and analysis
- **Data Scope**: All tables

### User Onboarding Flow

#### Step 1: Admin Creates Account
```sql
-- Admin invites new user via Supabase Auth
-- This creates entry in auth.users table
```

#### Step 2: Business Role Assignment
```sql
-- Admin assigns business role and vessel (if applicable)
INSERT INTO users (id, email, role, vessel_id, is_active)
VALUES (
  auth_user_id,
  'captain@vessel123.com',
  'vessel',
  vessel_uuid,
  true
);
```

#### Step 3: User Completes Setup
- User receives email invitation
- Sets password through Supabase Auth
- Logs in and accesses role-appropriate data

### Data Access Examples

#### Vessel User Query
```sql
-- Vessel sees only their pollock landings
SELECT * FROM tem_pollock_landings
WHERE vessel_id = (
  SELECT vessel_id FROM users WHERE id = auth.uid()
);
```

#### TEM Manager Query
```sql
-- TEM Manager sees all TEM data
SELECT v.name, COUNT(*) as trip_count, AVG(tpl.pounds) as avg_pounds
FROM tem_pollock_landings tpl
JOIN vessels v ON tpl.vessel_id = v.id
WHERE auth.uid() IN (
  SELECT id FROM users WHERE role IN ('tem_manager', 'admin')
)
GROUP BY v.name;
```

### Row Level Security Policies

#### Vessel Access Policy
```sql
CREATE POLICY vessel_data_access ON tem_pollock_landings
FOR ALL USING (
  vessel_id IN (
    SELECT vessel_id FROM users
    WHERE id = auth.uid() AND role = 'vessel'
  )
  OR
  auth.uid() IN (
    SELECT id FROM users
    WHERE role IN ('tem_manager', 'admin')
  )
);
```

#### Manager Access Policy
```sql
CREATE POLICY manager_access ON rp_quota_allocations
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM users
    WHERE role IN ('rockfish_manager', 'admin')
  )
);
```

**Status**: MVP data model complete with Supabase Auth integration ready.