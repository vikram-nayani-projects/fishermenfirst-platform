-- Create the critical missing table for TEM 4-trip average calculations
-- This table stores the rolling 4-trip averages that are core to TEM compliance

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
  is_egregious BOOLEAN NOT NULL DEFAULT FALSE, -- Over 335,000 lbs threshold
  violation_threshold INTEGER DEFAULT 300000,
  egregious_threshold INTEGER DEFAULT 335000,
  season_year INTEGER NOT NULL,
  landing_ids UUID[] NOT NULL, -- Array of tem_pollock_landings IDs in this calculation
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure we don't duplicate calculations for same vessel/date
  UNIQUE(vessel_id, calculation_date),

  -- Business rule: average_pounds = total_pounds / trip_count
  CONSTRAINT valid_average CHECK (
    ABS(average_pounds - (total_pounds::DECIMAL / trip_count)) < 0.01
  ),

  -- Business rule: compliant if under 300k average, egregious if over 335k average
  CONSTRAINT valid_compliance CHECK (
    (is_compliant = (average_pounds <= violation_threshold)) AND
    (is_egregious = (average_pounds > egregious_threshold))
  )
);

-- Index for performance on vessel lookups and date ranges
CREATE INDEX idx_tem_four_trip_vessel_date ON tem_four_trip_calculations(vessel_id, calculation_date);
CREATE INDEX idx_tem_four_trip_season ON tem_four_trip_calculations(season_year);
CREATE INDEX idx_tem_four_trip_compliance ON tem_four_trip_calculations(is_compliant, is_egregious);

-- Enable RLS
ALTER TABLE tem_four_trip_calculations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Vessels can only see their own calculations
CREATE POLICY vessel_four_trip_access ON tem_four_trip_calculations
  FOR ALL USING (
    vessel_id IN (
      SELECT v.id FROM vessels v
      WHERE v.id = vessel_id
      -- Add user access validation when user system is implemented
    )
  );

-- RLS Policy: TEM managers can see all calculations
CREATE POLICY tem_manager_four_trip_access ON tem_four_trip_calculations
  FOR ALL USING (
    -- For now, allow all access until user system is implemented
    TRUE
  );