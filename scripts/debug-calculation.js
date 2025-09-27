const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugCalculation() {
  console.log('🐛 Debugging calculation issue...\n');

  try {
    // Check landings
    const { data: landings } = await supabase
      .from('tem_pollock_landings')
      .select('*')
      .limit(1);

    if (landings && landings.length > 0) {
      const landing = landings[0];
      console.log('📊 First landing data:');
      console.log('   vessel_id:', landing.vessel_id);
      console.log('   landing_date:', landing.landing_date);
      console.log('   pounds:', landing.pounds);

      // Check if vessel exists with this ID
      const { data: vessel, error: vesselError } = await supabase
        .from('vessels')
        .select('*')
        .eq('id', landing.vessel_id)
        .single();

      if (vesselError) {
        console.log('❌ Vessel lookup error:', vesselError.message);
      } else if (!vessel) {
        console.log('❌ No vessel found with ID:', landing.vessel_id);
      } else {
        console.log('✅ Vessel found:');
        console.log('   id:', vessel.id);
        console.log('   name:', vessel.name);
        console.log('   length_feet:', vessel.length_feet);

        if (vessel.length_feet < 60) {
          console.log('⚠️  Vessel is <60ft - not subject to 4-trip averaging');
        } else {
          console.log('✅ Vessel is ≥60ft - subject to 4-trip averaging');

          // Now test the calculation
          console.log('\n🧮 Running calculation...');
          const { calculateFourTripAverage } = require('../lib/tem-calculations');
          const result = await calculateFourTripAverage(vessel.id);
          console.log('📊 Result:', JSON.stringify(result, null, 2));
        }
      }
    } else {
      console.log('❌ No landings found');
    }

  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
}

debugCalculation();