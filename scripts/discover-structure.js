const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function discoverStructure() {
  console.log('🔍 Discovering actual table structure...\n');

  try {
    // Try to get the table structure by attempting an insert with just basic fields
    console.log('Testing minimal insert to discover required fields...');

    const { data: vessels } = await supabase
      .from('vessels')
      .select('*')
      .limit(1);

    if (!vessels || vessels.length === 0) {
      console.log('❌ No vessels found');
      return;
    }

    const vessel = vessels[0];
    console.log(`✅ Using vessel: ${vessel.name} (${vessel.id})`);

    // Try basic insert to see what's required
    const { data, error } = await supabase
      .from('tem_pollock_landings')
      .insert({
        vessel_id: vessel.id,
        landing_date: '2025-01-01',
        pounds: 280000
      })
      .select()
      .single();

    if (error) {
      console.log('❌ Minimal insert failed:', error.message);

      // Try with processor_id
      console.log('\nTrying with processor_id...');
      const { data: data2, error: error2 } = await supabase
        .from('tem_pollock_landings')
        .insert({
          vessel_id: vessel.id,
          landing_date: '2025-01-01',
          pounds: 280000,
          processor_id: '6d6d66fa-03ab-4d08-b950-c9efea4946a8'
        })
        .select()
        .single();

      if (error2) {
        console.log('❌ With processor_id failed:', error2.message);
      } else {
        console.log('✅ SUCCESS! Actual columns:', Object.keys(data2));
        // Clean up
        await supabase.from('tem_pollock_landings').delete().eq('id', data2.id);
      }
    } else {
      console.log('✅ SUCCESS! Actual columns:', Object.keys(data));
      // Clean up
      await supabase.from('tem_pollock_landings').delete().eq('id', data.id);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

discoverStructure();