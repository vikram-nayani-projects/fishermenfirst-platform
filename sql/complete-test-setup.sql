-- Complete SQL to run in Supabase Dashboard SQL Editor
-- This will create test data to work with your existing table structure

-- 1. First, let's create a test processor (if processors table exists)
INSERT INTO processors (id, name, code, location)
VALUES ('6d6d66fa-03ab-4d08-b950-c9efea4946a8', 'Test Processor Kodiak', 'TPK001', 'Kodiak')
ON CONFLICT (id) DO NOTHING;

-- 2. Create test pollock landing with all required fields
-- Based on the errors, your table needs: vessel_id, landing_date, delivery_date, pounds, processor_id, season
INSERT INTO tem_pollock_landings (
  vessel_id,
  landing_date,
  delivery_date,
  pounds,
  processor_id,
  season,
  fish_ticket,
  gear_type,
  target_species,
  created_at
) VALUES (
  (SELECT id FROM vessels LIMIT 1),  -- Use existing vessel
  '2025-01-01',
  '2025-01-01',
  280000,
  '6d6d66fa-03ab-4d08-b950-c9efea4946a8',
  'A',  -- Assuming A/B season
  'TEST001',
  'Trawl',
  'Pollock',
  NOW()
);

-- 3. Add a few more landings for 4-trip calculation testing
INSERT INTO tem_pollock_landings (
  vessel_id,
  landing_date,
  delivery_date,
  pounds,
  processor_id,
  season,
  fish_ticket,
  gear_type,
  target_species,
  created_at
) VALUES
(
  (SELECT id FROM vessels LIMIT 1),
  '2025-01-02',
  '2025-01-02',
  290000,
  '6d6d66fa-03ab-4d08-b950-c9efea4946a8',
  'A',
  'TEST002',
  'Trawl',
  'Pollock',
  NOW()
),
(
  (SELECT id FROM vessels LIMIT 1),
  '2025-01-03',
  '2025-01-03',
  310000,
  '6d6d66fa-03ab-4d08-b950-c9efea4946a8',
  'A',
  'TEST003',
  'Trawl',
  'Pollock',
  NOW()
),
(
  (SELECT id FROM vessels LIMIT 1),
  '2025-01-04',
  '2025-01-04',
  320000,
  '6d6d66fa-03ab-4d08-b950-c9efea4946a8',
  'A',
  'TEST004',
  'Trawl',
  'Pollock',
  NOW()
),
(
  (SELECT id FROM vessels LIMIT 1),
  '2025-01-05',
  '2025-01-05',
  340000,
  '6d6d66fa-03ab-4d08-b950-c9efea4946a8',
  'A',
  'TEST005',
  'Trawl',
  'Pollock',
  NOW()
);

-- 4. Check what we created
SELECT
  v.name as vessel_name,
  tpl.landing_date,
  tpl.pounds,
  tpl.season,
  tpl.fish_ticket
FROM tem_pollock_landings tpl
JOIN vessels v ON tpl.vessel_id = v.id
ORDER BY tpl.landing_date;