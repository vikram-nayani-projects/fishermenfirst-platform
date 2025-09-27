const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDataV2() {
  console.log('🔧 Creating test data v2 - with season field...\n');

  try {
    // Step 1: Ensure processor exists
    console.log('🏭 Ensuring test processor exists...');
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

    // Step 3: Create landings with season field
    console.log('\n🐟 Creating test landings with season...');

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
      season: 'A'  // Adding required season field
    }));

    const { data: landings, error: landingError } = await supabase
      .from('tem_pollock_landings')
      .insert(landingsToInsert)
      .select();

    if (landingError) {
      console.log('❌ Landing creation still failed:', landingError.message);

      // Try to discover what other fields are required
      console.log('\n🔍 Testing with additional fields...');

      const testRecord = {
        vessel_id: vessel.id,
        landing_date: '2025-01-01',
        delivery_date: '2025-01-01',
        pounds: 280000,
        processor_id: '6d6d66fa-03ab-4d08-b950-c9efea4946a8',
        season: 'A',
        fish_ticket: 'TEST001',
        gear_type: 'Trawl',
        target_species: 'Pollock'
      };

      const { data: testResult, error: testError } = await supabase
        .from('tem_pollock_landings')
        .insert(testRecord)
        .select()
        .single();

      if (testError) {
        console.log('❌ Even with extra fields failed:', testError.message);
      } else {
        console.log('✅ SUCCESS with extra fields! Columns:', Object.keys(testResult));

        // Clean up test record
        await supabase.from('tem_pollock_landings').delete().eq('id', testResult.id);

        // Now insert all records with the working structure
        const fullLandings = testLandings.map(landing => ({
          vessel_id: vessel.id,
          landing_date: landing.date,
          delivery_date: landing.date,
          pounds: landing.pounds,
          processor_id: '6d6d66fa-03ab-4d08-b950-c9efea4946a8',
          season: 'A',
          fish_ticket: `TEST${landing.date.slice(-2)}`,
          gear_type: 'Trawl',
          target_species: 'Pollock'
        }));

        const { data: finalLandings, error: finalError } = await supabase
          .from('tem_pollock_landings')
          .insert(fullLandings)
          .select();

        if (finalError) {
          console.log('❌ Final insert failed:', finalError.message);
        } else {
          console.log(`✅ Created ${finalLandings.length} test landings successfully!`);
        }
      }

      return;
    }

    console.log(`✅ Created ${landings.length} test landings`);

    // Step 4: Verify
    console.log('\n📊 Verifying created data...');
    const { data: allLandings } = await supabase
      .from('tem_pollock_landings')
      .select('landing_date, pounds')
      .order('landing_date');

    console.log('Landings in database:');
    allLandings.forEach((landing, i) => {
      console.log(`   ${i + 1}. ${landing.landing_date}: ${landing.pounds.toLocaleString()} lbs`);
    });

    console.log('\n✅ Test data creation complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestDataV2();