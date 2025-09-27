const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function workWithExisting() {
  console.log('🔧 Working with existing table structure...\n');

  try {
    const { data: vessels } = await supabase
      .from('vessels')
      .select('*')
      .limit(1);

    const vessel = vessels[0];
    console.log(`✅ Using vessel: ${vessel.name}`);

    // Try with all the fields we discovered are required
    console.log('\n🐟 Creating landing with all required fields...');

    const { data: landing, error: landingError } = await supabase
      .from('tem_pollock_landings')
      .insert({
        vessel_id: vessel.id,
        landing_date: '2025-01-01',
        delivery_date: '2025-01-01', // Same as landing date
        pounds: 280000,
        processor_id: randomUUID() // Random UUID for now
      })
      .select()
      .single();

    if (landingError) {
      console.log('❌ Failed:', landingError.message);
      console.log('💡 Let me show you the exact SQL to run in Supabase dashboard...');

      console.log('\n📋 SQL TO RUN IN SUPABASE:');
      console.log(`
-- First create a test processor if none exist
INSERT INTO processors (id, name) VALUES ('${randomUUID()}', 'Test Processor')
ON CONFLICT DO NOTHING;

-- Then try creating the landing
INSERT INTO tem_pollock_landings (
  vessel_id,
  landing_date,
  delivery_date,
  pounds,
  processor_id
) VALUES (
  '${vessel.id}',
  '2025-01-01',
  '2025-01-01',
  280000,
  (SELECT id FROM processors LIMIT 1)
);
      `);

    } else {
      console.log('✅ SUCCESS! Landing created');
      console.log('📊 Full structure:', Object.keys(landing));

      // Clean up
      await supabase
        .from('tem_pollock_landings')
        .delete()
        .eq('id', landing.id);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

workWithExisting();