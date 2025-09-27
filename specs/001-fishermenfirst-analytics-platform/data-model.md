# Data Model: FishermenFirst Analytics Platform

## Database Schema Design

### Program Isolation Strategy
All tables use strict prefixing to ensure complete data isolation:
- **TEM Program**: `tem_` prefix for all tables
- **Rockfish Program**: `rp_` prefix for all tables
- **Shared System**: No prefix (users, audit logs)

### Core Entities

## User Management

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TYPE user_role AS ENUM ('vessel', 'tem_manager', 'rockfish_manager', 'platform_admin');
```

### user_program_access
```sql
CREATE TABLE user_program_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  program_type program_type NOT NULL,
  vessel_id UUID NULL, -- Only for vessel users
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TYPE program_type AS ENUM ('TEM', 'ROCKFISH');
```

## Vessel Registry

### vessels
```sql
CREATE TABLE vessels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_name TEXT NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  length_feet INTEGER NOT NULL,
  owner_name TEXT NOT NULL,
  home_port TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### vessel_program_participation
```sql
CREATE TABLE vessel_program_participation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id UUID REFERENCES vessels(id) ON DELETE CASCADE,
  program_type program_type NOT NULL,
  season_year INTEGER NOT NULL,
  registration_date TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(vessel_id, program_type, season_year)
);
```

## TEM Program Tables

### tem_pollock_landings
```sql
CREATE TABLE tem_pollock_landings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id UUID REFERENCES vessels(id) NOT NULL,
  landing_date DATE NOT NULL,
  pounds INTEGER NOT NULL CHECK (pounds > 0),
  species_code TEXT NOT NULL DEFAULT 'POLL',
  landing_port TEXT,
  delivery_id TEXT, -- External system reference
  season_year INTEGER NOT NULL,
  season_type season_type NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  is_correction BOOLEAN DEFAULT FALSE,
  corrects_landing_id UUID REFERENCES tem_pollock_landings(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_landing_date CHECK (landing_date <= CURRENT_DATE),
  CONSTRAINT reasonable_catch CHECK (pounds <= 500000)
);

CREATE TYPE season_type AS ENUM ('A_SEASON', 'B_SEASON');
```

### tem_trip_calculations
```sql
CREATE TABLE tem_trip_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id UUID REFERENCES vessels(id) NOT NULL,
  calculation_date DATE NOT NULL,
  trip_group_start_date DATE NOT NULL,
  trip_group_end_date DATE NOT NULL,
  trip_count INTEGER NOT NULL,
  total_pounds INTEGER NOT NULL,
  average_pounds DECIMAL(10,2) NOT NULL,
  is_violation BOOLEAN NOT NULL,
  violation_threshold INTEGER DEFAULT 300000,
  season_year INTEGER NOT NULL,
  season_type season_type NOT NULL,
  landing_ids UUID[] NOT NULL, -- Array of landing IDs in this calculation
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### tem_violations
```sql
CREATE TABLE tem_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id UUID REFERENCES vessels(id) NOT NULL,
  calculation_id UUID REFERENCES tem_trip_calculations(id) NOT NULL,
  violation_date DATE NOT NULL,
  average_pounds DECIMAL(10,2) NOT NULL,
  penalty_amount DECIMAL(10,2),
  violation_number INTEGER, -- Sequential numbering for progressive penalties
  status violation_status DEFAULT 'PENDING',
  resolution_date DATE,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE violation_status AS ENUM ('PENDING', 'RESOLVED', 'APPEALED', 'DISMISSED');
```

### tem_mra_violations
```sql
CREATE TABLE tem_mra_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id UUID REFERENCES vessels(id) NOT NULL,
  landing_id UUID REFERENCES tem_pollock_landings(id) NOT NULL,
  violation_type mra_violation_type NOT NULL,
  species_code TEXT NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  threshold_percentage DECIMAL(5,2) NOT NULL,
  pounds INTEGER NOT NULL,
  status violation_status DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE mra_violation_type AS ENUM ('PACIFIC_COD', 'SALMON', 'HALIBUT', 'OTHER_SPECIES');
```

## Rockfish Program Tables

### rp_species_config
```sql
CREATE TABLE rp_species_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species_code TEXT UNIQUE NOT NULL,
  species_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Insert standard species
INSERT INTO rp_species_config (species_code, species_name) VALUES
('POP', 'Pacific Ocean Perch'),
('NORF', 'Northern Rockfish'),
('DUSKY', 'Dusky Rockfish');
```

### rp_quota_allocations
```sql
CREATE TABLE rp_quota_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id UUID REFERENCES vessels(id) NOT NULL,
  species_code TEXT REFERENCES rp_species_config(species_code) NOT NULL,
  season_year INTEGER NOT NULL,
  initial_allocation INTEGER NOT NULL CHECK (initial_allocation >= 0),
  current_allocation INTEGER NOT NULL CHECK (current_allocation >= 0),
  used_pounds INTEGER DEFAULT 0 CHECK (used_pounds >= 0),
  remaining_pounds INTEGER GENERATED ALWAYS AS (current_allocation - used_pounds) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vessel_id, species_code, season_year)
);
```

### rp_rockfish_landings
```sql
CREATE TABLE rp_rockfish_landings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id UUID REFERENCES vessels(id) NOT NULL,
  species_code TEXT REFERENCES rp_species_config(species_code) NOT NULL,
  landing_date DATE NOT NULL,
  pounds INTEGER NOT NULL CHECK (pounds > 0),
  landing_port TEXT,
  is_overage BOOLEAN DEFAULT FALSE,
  overage_resolved BOOLEAN DEFAULT FALSE,
  resolution_notes TEXT,
  season_year INTEGER NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  is_correction BOOLEAN DEFAULT FALSE,
  corrects_landing_id UUID REFERENCES rp_rockfish_landings(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_landing_date CHECK (landing_date <= CURRENT_DATE)
);
```

### rp_quota_transfers
```sql
CREATE TABLE rp_quota_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_vessel_id UUID REFERENCES vessels(id) NOT NULL,
  to_vessel_id UUID REFERENCES vessels(id) NOT NULL,
  species_code TEXT REFERENCES rp_species_config(species_code) NOT NULL,
  transfer_type transfer_type NOT NULL,
  pounds INTEGER NOT NULL CHECK (pounds > 0),
  season_year INTEGER NOT NULL,
  status transfer_status DEFAULT 'PENDING',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  effective_at TIMESTAMPTZ,
  notes TEXT,
  CONSTRAINT no_self_transfer CHECK (from_vessel_id != to_vessel_id)
);

CREATE TYPE transfer_type AS ENUM ('LEASE', 'PERMANENT', 'OVERAGE_COVER');
CREATE TYPE transfer_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');
```

### rp_salmon_bycatch
```sql
CREATE TABLE rp_salmon_bycatch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id UUID REFERENCES vessels(id) NOT NULL,
  landing_date DATE NOT NULL,
  chinook_count INTEGER DEFAULT 0 CHECK (chinook_count >= 0),
  coho_count INTEGER DEFAULT 0 CHECK (coho_count >= 0),
  season_year INTEGER NOT NULL,
  fleet_total_chinook INTEGER, -- Calculated field for monitoring
  fleet_cap_chinook INTEGER DEFAULT 1200,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## System Tables

### season_configurations
```sql
CREATE TABLE season_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_type program_type NOT NULL,
  season_year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  configuration JSONB, -- Program-specific settings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_type, season_year)
);
```

### audit_logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation operation_type NOT NULL,
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  context JSONB -- Additional context like user agent, IP, etc.
);

CREATE TYPE operation_type AS ENUM ('INSERT', 'UPDATE', 'DELETE');
```

### file_storage_log
```sql
CREATE TABLE file_storage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  program_type program_type NOT NULL,
  season_year INTEGER NOT NULL,
  status file_status DEFAULT 'RECEIVED',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE file_status AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'ERROR', 'RETRY');
```

## Row Level Security Policies

### Vessel Access Policy
```sql
-- Vessels see only their own data
CREATE POLICY vessel_access ON tem_pollock_landings
  FOR ALL USING (
    vessel_id IN (
      SELECT vessel_id FROM user_program_access
      WHERE user_id = auth.uid()
      AND program_type = 'TEM'
      AND is_active = TRUE
    )
  );

CREATE POLICY vessel_access ON rp_quota_allocations
  FOR ALL USING (
    vessel_id IN (
      SELECT vessel_id FROM user_program_access
      WHERE user_id = auth.uid()
      AND program_type = 'ROCKFISH'
      AND is_active = TRUE
    )
  );
```

### Manager Access Policy
```sql
-- TEM managers see all TEM data
CREATE POLICY tem_manager_access ON tem_pollock_landings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('tem_manager', 'platform_admin')
    )
  );

-- Rockfish managers see all Rockfish data
CREATE POLICY rockfish_manager_access ON rp_quota_allocations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('rockfish_manager', 'platform_admin')
    )
  );
```

### Admin Read-Only Policy
```sql
-- Platform admins have read-only access to all data
CREATE POLICY admin_readonly_access ON tem_pollock_landings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'platform_admin'
    )
  );
```

## Database Triggers

### Audit Trigger Function
```sql
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    table_name,
    record_id,
    operation,
    old_values,
    new_values,
    user_id
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP::operation_type,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

### TEM Landing Processing Trigger
```sql
CREATE OR REPLACE FUNCTION process_tem_landing()
RETURNS TRIGGER AS $$
BEGIN
  -- Route to appropriate calculation based on vessel size
  IF (SELECT length_feet FROM vessels WHERE id = NEW.vessel_id) >= 60 THEN
    -- Call 4-trip calculation function
    PERFORM calculate_four_trip_average(NEW.vessel_id, NEW.season_year, NEW.season_type);
  ELSE
    -- Call calendar day calculation function
    PERFORM calculate_calendar_day_total(NEW.vessel_id, NEW.season_year, NEW.season_type);
  END IF;

  -- Check MRA violations
  PERFORM check_mra_violations(NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tem_landing_trigger
  AFTER INSERT ON tem_pollock_landings
  FOR EACH ROW
  EXECUTE FUNCTION process_tem_landing();
```

### Rockfish Quota Update Trigger
```sql
CREATE OR REPLACE FUNCTION update_rockfish_quotas()
RETURNS TRIGGER AS $$
BEGIN
  -- Update quota allocation used_pounds
  UPDATE rp_quota_allocations
  SET used_pounds = used_pounds + NEW.pounds,
      updated_at = NOW()
  WHERE vessel_id = NEW.vessel_id
    AND species_code = NEW.species_code
    AND season_year = NEW.season_year;

  -- Check if quota exceeded
  IF (SELECT remaining_pounds FROM rp_quota_allocations
      WHERE vessel_id = NEW.vessel_id
        AND species_code = NEW.species_code
        AND season_year = NEW.season_year) < 0 THEN
    -- Mark as overage
    UPDATE rp_rockfish_landings
    SET is_overage = TRUE
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rp_landing_trigger
  AFTER INSERT ON rp_rockfish_landings
  FOR EACH ROW
  EXECUTE FUNCTION update_rockfish_quotas();
```

## Data Validation Rules

### Business Rules
1. **TEM 4-Trip Calculations**: Groups of 4 consecutive trips for vessels ≥60ft
2. **TEM Calendar Day Calculations**: Groups of trips by calendar day for vessels <60ft
3. **Egregious Trips**: Trips >335,000 lbs excluded from averages but tracked separately
4. **Quota Transfers**: Cannot exceed vessel or processor caps
5. **Salmon Bycatch**: Fleet-wide cap of 1,200 Chinook salmon (extrapolated)

### Data Constraints
- All landing weights must be positive integers
- Landing dates cannot be in the future
- Quota allocations cannot be negative
- Users can only access data for their assigned programs
- Audit logs are immutable (no updates or deletes)

## Performance Considerations

### Indexing Strategy
```sql
-- Primary performance indexes
CREATE INDEX idx_tem_landings_vessel_date ON tem_pollock_landings(vessel_id, landing_date);
CREATE INDEX idx_tem_landings_season ON tem_pollock_landings(season_year, season_type);
CREATE INDEX idx_rp_allocations_vessel_species ON rp_quota_allocations(vessel_id, species_code);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

### Query Optimization
- Use materialized views for complex reporting queries
- Partition large tables by season_year if needed
- Regular VACUUM and ANALYZE operations

---

**Data Model Complete**: All entities defined with proper relationships, constraints, and security policies.