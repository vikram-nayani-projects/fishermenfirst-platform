const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simpleTest() {
  console.log('🧪 Simple TEM Test...\n');

  try {
    // Get existing vessel
    const { data: vessels } = await supabase
      .from('vessels')
      .select('*')
      .limit(1);

    if (!vessels || vessels.length === 0) {
      console.log('❌ No vessels found');
      return;
    }

    const vessel = vessels[0];
    console.log(`✅ Using vessel: ${vessel.name} (${vessel.length_feet}ft)`);

    // Try simple landing insert with minimal fields
    const { data: landing, error: landingError } = await supabase
      .from('tem_pollock_landings')
      .insert({
        vessel_id: vessel.id,
        landing_date: '2025-01-01',
        pounds: 280000
      })
      .select()
      .single();

    if (landingError) {
      console.log('❌ Landing insert failed:', landingError.message);
      console.log('   Available columns might be different than expected');
    } else {
      console.log('✅ Successfully created landing:', landing);

      // Try the calculation
      const { calculateFourTripAverage } = require('../lib/tem-calculations');
      const result = await calculateFourTripAverage(vessel.id);
      console.log('📊 Calculation result:', result);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

simpleTest();