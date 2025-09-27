-- Minimal SQL to create test data for tem_pollock_landings
-- Only includes fields that actually exist and are required

-- 1. Create test processor with required code field
INSERT INTO processors (id, name, code, location)
VALUES ('6d6d66fa-03ab-4d08-b950-c9efea4946a8', 'Test Processor Kodiak', 'TPK001', 'Kodiak')
ON CONFLICT (id) DO NOTHING;

-- 2. Create test pollock landings with only required fields
INSERT INTO tem_pollock_landings (
  vessel_id,
  landing_date,
  delivery_date,
  pounds,
  processor_id
) VALUES
(
  (SELECT id FROM vessels LIMIT 1),
  '2025-01-01',
  '2025-01-01',
  280000,
  '6d6d66fa-03ab-4d08-b950-c9efea4946a8'
),
(
  (SELECT id FROM vessels LIMIT 1),
  '2025-01-02',
  '2025-01-02',
  290000,
  '6d6d66fa-03ab-4d08-b950-c9efea4946a8'
),
(
  (SELECT id FROM vessels LIMIT 1),
  '2025-01-03',
  '2025-01-03',
  310000,
  '6d6d66fa-03ab-4d08-b950-c9efea4946a8'
),
(
  (SELECT id FROM vessels LIMIT 1),
  '2025-01-04',
  '2025-01-04',
  320000,
  '6d6d66fa-03ab-4d08-b950-c9efea4946a8'
),
(
  (SELECT id FROM vessels LIMIT 1),
  '2025-01-05',
  '2025-01-05',
  340000,
  '6d6d66fa-03ab-4d08-b950-c9efea4946a8'
);

-- 3. Check what we created
SELECT
  v.name as vessel_name,
  tpl.landing_date,
  tpl.pounds
FROM tem_pollock_landings tpl
JOIN vessels v ON tpl.vessel_id = v.id
ORDER BY tpl.landing_date;