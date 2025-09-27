const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAndTest() {
  console.log('🔧 Fixing processor issue and testing...\n');

  try {
    // Check if processors table exists
    const { data: processors, error: procError } = await supabase
      .from('processors')
      .select('*')
      .limit(1);

    let processorId;

    if (procError || !processors || processors.length === 0) {
      console.log('🏭 Creating test processor...');

      // Try to create a processor (might fail if table doesn't exist)
      const { data: newProcessor, error: createError } = await supabase
        .from('processors')
        .insert({
          name: 'Test Processor',
          location: 'Kodiak',
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        console.log('❌ Processors table might not exist:', createError.message);
        console.log('💡 Let me try inserting with a random UUID...');

        // Generate a random UUID for processor_id
        processorId = crypto.randomUUID();
      } else {
        processorId = newProcessor.id;
        console.log(`✅ Created processor: ${newProcessor.name}`);
      }
    } else {
      processorId = processors[0].id;
      console.log(`✅ Using existing processor: ${processors[0].name}`);
    }

    // Now try the landing with processor_id
    const { data: vessels } = await supabase
      .from('vessels')
      .select('*')
      .limit(1);

    const vessel = vessels[0];

    console.log('\n🐟 Creating pollock landing...');
    const { data: landing, error: landingError } = await supabase
      .from('tem_pollock_landings')
      .insert({
        vessel_id: vessel.id,
        landing_date: '2025-01-01',
        pounds: 280000,
        processor_id: processorId
      })
      .select()
      .single();

    if (landingError) {
      console.log('❌ Still failed:', landingError.message);
    } else {
      console.log('✅ SUCCESS! Landing created:', {
        id: landing.id,
        vessel_id: landing.vessel_id,
        pounds: landing.pounds,
        date: landing.landing_date
      });

      console.log('\n📊 Available columns:', Object.keys(landing));

      // Clean up
      await supabase
        .from('tem_pollock_landings')
        .delete()
        .eq('id', landing.id);

      console.log('✅ Test data cleaned up');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixAndTest();