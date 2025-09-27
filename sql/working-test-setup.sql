-- Working SQL based on actual schema requirements
-- tem_pollock_landings requires: vessel_id, landing_date, pounds, processor_id (UUID), delivery_date

-- 1. Create a processor first (checking actual columns that exist)
INSERT INTO processors (id, name, code, location)
VALUES ('6d6d66fa-03ab-4d08-b950-c9efea4946a8', 'Test Processor', 'TEST01', 'Kodiak')
ON CONFLICT (id) DO NOTHING;

-- 2. Create test landings with correct UUID processor_id
INSERT INTO tem_pollock_landings (
  vessel_id,
  landing_date,
  delivery_date,
  pounds,
  processor_id
) VALUES
(
  '8aa52a16-580d-4f0e-9c5e-3e301d5ccbb6',  -- Using actual vessel ID from test
  '2025-01-01',
  '2025-01-01',
  280000,
  '6d6d66fa-03ab-4d08-b950-c9efea4946a8'
),
(
  '8aa52a16-580d-4f0e-9c5e-3e301d5ccbb6',
  '2025-01-02',
  '2025-01-02',
  290000,
  '6d6d66fa-03ab-4d08-b950-c9efea4946a8'
),
(
  '8aa52a16-580d-4f0e-9c5e-3e301d5ccbb6',
  '2025-01-03',
  '2025-01-03',
  310000,
  '6d6d66fa-03ab-4d08-b950-c9efea4946a8'
),
(
  '8aa52a16-580d-4f0e-9c5e-3e301d5ccbb6',
  '2025-01-04',
  '2025-01-04',
  320000,
  '6d6d66fa-03ab-4d08-b950-c9efea4946a8'
),
(
  '8aa52a16-580d-4f0e-9c5e-3e301d5ccbb6',
  '2025-01-05',
  '2025-01-05',
  340000,
  '6d6d66fa-03ab-4d08-b950-c9efea4946a8'
);

-- 3. Verify what was created
SELECT
  COUNT(*) as landing_count,
  MIN(landing_date) as first_date,
  MAX(landing_date) as last_date,
  SUM(pounds) as total_pounds
FROM tem_pollock_landings;