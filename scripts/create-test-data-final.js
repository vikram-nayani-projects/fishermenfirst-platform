const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDataFinal() {
  console.log('🔧 Creating test data FINAL - with correct required fields...\n');

  try {
    // Step 1: Ensure processor exists
    const { error: procError } = await supabase
      .from('processors')
      .upsert({
        id: '6d6d66fa-03ab-4d08-b950-c9efea4946a8',
        name: 'Test Processor',
        code: 'TEST01',
        location: 'Kodiak'
      });

    if (procError) {
      console.log('❌ Processor upsert failed:', procError.message);
      return;
    }
    console.log('✅ Processor ready');

    // Step 2: Get vessel
    const { data: vessels } = await supabase
      .from('vessels')
      .select('id, name')
      .limit(1);

    const vessel = vessels[0];
    console.log(`✅ Using vessel: ${vessel.name}`);

    // Step 3: Create landings with correct required fields
    console.log('\n🐟 Creating test landings with season and season_year...');

    const testLandings = [
      { date: '2025-01-01', pounds: 280000 },
      { date: '2025-01-02', pounds: 290000 },
      { date: '2025-01-03', pounds: 310000 },
      { date: '2025-01-04', pounds: 320000 },
      { date: '2025-01-05', pounds: 340000 }
    ];

    const landingsToInsert = testLandings.map(landing => ({
      vessel_id: vessel.id,
      landing_date: landing.date,
      delivery_date: landing.date,
      pounds: landing.pounds,
      processor_id: '6d6d66fa-03ab-4d08-b950-c9efea4946a8',
      season: 'A',
      season_year: 2025  // Adding required season_year field
    }));

    const { data: landings, error: landingError } = await supabase
      .from('tem_pollock_landings')
      .insert(landingsToInsert)
      .select();

    if (landingError) {
      console.log('❌ Landing creation failed:', landingError.message);
      return;
    }

    console.log(`✅ Created ${landings.length} test landings successfully!`);

    // Step 4: Verify
    console.log('\n📊 Verifying created data...');
    const { data: allLandings } = await supabase
      .from('tem_pollock_landings')
      .select('landing_date, pounds, season, season_year')
      .order('landing_date');

    console.log('Landings in database:');
    allLandings.forEach((landing, i) => {
      console.log(`   ${i + 1}. ${landing.landing_date}: ${landing.pounds.toLocaleString()} lbs (Season ${landing.season} ${landing.season_year})`);
    });

    console.log('\n✅ Test data creation complete! Ready to test calculations.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestDataFinal();