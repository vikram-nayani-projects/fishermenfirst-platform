const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAfterSQL() {
  console.log('🧪 Testing after running SQL setup...\n');

  try {
    // Check if landings were created
    const { data: landings, error: landingsError } = await supabase
      .from('tem_pollock_landings')
      .select('*')
      .order('landing_date');

    if (landingsError) {
      console.log('❌ Error fetching landings:', landingsError.message);
      return;
    }

    console.log(`✅ Found ${landings.length} landings:`);
    landings.forEach((landing, index) => {
      console.log(`   ${index + 1}. ${landing.landing_date}: ${landing.pounds.toLocaleString()} lbs`);
    });

    if (landings.length >= 4) {
      console.log('\n🧮 Testing 4-trip calculation...');

      // Test our calculation function
      const { calculateFourTripAverage } = require('../lib/tem-calculations');
      const result = await calculateFourTripAverage(landings[0].vessel_id);

      console.log('📊 Calculation result:', JSON.stringify(result, null, 2));
    } else {
      console.log('\n⚠️  Need at least 4 landings for 4-trip calculation');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAfterSQL();