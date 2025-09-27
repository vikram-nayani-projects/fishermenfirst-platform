const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTEMCalculations() {
  console.log('🧪 Testing TEM 4-Trip Average Calculations...\n');

  try {
    // 1. Get a vessel ID (or create test vessel)
    let { data: vessels, error: vesselError } = await supabase
      .from('vessels')
      .select('*')
      .gte('length_feet', 60)
      .limit(1);

    if (vesselError || !vessels.length) {
      console.log('Creating test vessel ≥60ft...');
      const { data: newVessel, error: createError } = await supabase
        .from('vessels')
        .insert({
          name: 'Test Vessel TEM',
          registration_number: 'TEM-TEST-001',
          length_feet: 75,
          vessel_type: 'TRAWLER'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create test vessel:', createError.message);
        return;
      }
      vessels = [newVessel];
    }

    const testVessel = vessels[0];
    console.log(`✅ Using vessel: ${testVessel.name} (${testVessel.length_feet}ft)`);

    // 2. Clear existing landings for clean test
    await supabase
      .from('tem_pollock_landings')
      .delete()
      .eq('vessel_id', testVessel.id);

    await supabase
      .from('tem_four_trip_calculations')
      .delete()
      .eq('vessel_id', testVessel.id);

    // 3. Create test landings that should trigger violations
    const testLandings = [
      { pounds: 280000, landing_date: '2025-01-01' }, // Trip 1
      { pounds: 290000, landing_date: '2025-01-02' }, // Trip 2
      { pounds: 310000, landing_date: '2025-01-03' }, // Trip 3
      { pounds: 320000, landing_date: '2025-01-04' }, // Trip 4 - Average: 300,000 (compliant)
      { pounds: 340000, landing_date: '2025-01-05' }  // Trip 5 - New average: 315,000 (violation!)
    ];

    console.log('\n📊 Creating test landings...');
    for (const [index, landing] of testLandings.entries()) {
      const { data, error } = await supabase
        .from('tem_pollock_landings')
        .insert({
          vessel_id: testVessel.id,
          landing_date: landing.landing_date,
          pounds: landing.pounds,
          species_code: 'POLL',
          season_year: 2025
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed to create landing ${index + 1}:`, error.message);
      } else {
        console.log(`   ✅ Trip ${index + 1}: ${landing.pounds.toLocaleString()} lbs on ${landing.landing_date}`);
      }
    }

    // 4. Test the calculation via API
    console.log('\n🔄 Testing API endpoint...');
    const response = await fetch('http://localhost:3000/api/tem/landings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vessel_id: testVessel.id,
        landing_date: '2025-01-06',
        pounds: 350000,
        season_year: 2025
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ API Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ API call failed - server may not be running');
      console.log('   Try: npm run dev');
    }

    // 5. Check final calculations
    console.log('\n📈 Final 4-Trip Calculations:');
    const { data: calculations, error: calcError } = await supabase
      .from('tem_four_trip_calculations')
      .select('*')
      .eq('vessel_id', testVessel.id)
      .order('trip_group_start_date');

    if (calcError) {
      console.error('❌ Failed to fetch calculations:', calcError.message);
    } else {
      calculations.forEach((calc, index) => {
        const status = calc.is_compliant ? '✅ COMPLIANT' : '❌ VIOLATION';
        console.log(`   Calculation ${index + 1}: ${calc.average_pounds.toLocaleString()} lbs avg ${status}`);
        console.log(`     Trips: ${calc.trip_group_start_date} to ${calc.trip_group_end_date}`);
      });
    }

    console.log('\n🎯 Expected Results:');
    console.log('   - First 4 trips: 300,000 lbs average (COMPLIANT)');
    console.log('   - Trips 2-5: 315,000 lbs average (VIOLATION - over 300,000)');
    console.log('   - This demonstrates the rolling 4-trip average logic');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTEMCalculations();