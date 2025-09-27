const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 Checking actual database schema...\n');

  try {
    // Method 1: Try to query information_schema
    console.log('📋 Checking tem_pollock_landings columns...');
    const { data: columns, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'tem_pollock_landings' });

    if (schemaError) {
      console.log('❌ Schema query failed, trying direct approach...');

      // Method 2: Try empty select to see columns
      const { data: empty, error: emptyError } = await supabase
        .from('tem_pollock_landings')
        .select('*')
        .limit(0);

      if (emptyError) {
        console.log('❌ Empty select failed:', emptyError.message);
      } else {
        console.log('✅ Table exists but no structure info available');
      }

      // Method 3: Check processors table
      console.log('\n📋 Checking processors table...');
      const { data: procEmpty, error: procError } = await supabase
        .from('processors')
        .select('*')
        .limit(1);

      if (procError) {
        console.log('❌ Processors query failed:', procError.message);
      } else {
        if (procEmpty.length > 0) {
          console.log('✅ Processors columns:', Object.keys(procEmpty[0]));
        } else {
          console.log('✅ Processors table exists but is empty');
        }
      }

      // Method 4: Check vessels table for reference
      console.log('\n📋 Checking vessels table...');
      const { data: vessels, error: vesselError } = await supabase
        .from('vessels')
        .select('*')
        .limit(1);

      if (vesselError) {
        console.log('❌ Vessels query failed:', vesselError.message);
      } else if (vessels.length > 0) {
        console.log('✅ Vessels columns:', Object.keys(vessels[0]));
        console.log('   Sample vessel:', { id: vessels[0].id, name: vessels[0].name });
      }

    } else {
      console.log('✅ Column info:', columns);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Method 5: Test what actually works with incremental field testing
  console.log('\n🧪 Testing incremental field requirements...');

  try {
    const { data: vessels } = await supabase.from('vessels').select('id').limit(1);
    if (!vessels?.length) {
      console.log('❌ No vessels available for testing');
      return;
    }

    const vesselId = vessels[0].id;

    // Test different field combinations
    const tests = [
      { vessel_id: vesselId },
      { vessel_id: vesselId, landing_date: '2025-01-01' },
      { vessel_id: vesselId, landing_date: '2025-01-01', pounds: 280000 },
      { vessel_id: vesselId, landing_date: '2025-01-01', pounds: 280000, processor_id: 'test' },
      { vessel_id: vesselId, landing_date: '2025-01-01', pounds: 280000, processor_id: 'test', delivery_date: '2025-01-01' }
    ];

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      console.log(`   Test ${i + 1}: ${Object.keys(test).join(', ')}`);

      const { data, error } = await supabase
        .from('tem_pollock_landings')
        .insert(test)
        .select()
        .single();

      if (error) {
        console.log(`   ❌ ${error.message}`);
      } else {
        console.log(`   ✅ SUCCESS! Full columns:`, Object.keys(data));
        // Clean up
        await supabase.from('tem_pollock_landings').delete().eq('id', data.id);
        break;
      }
    }

  } catch (error) {
    console.error('❌ Incremental test error:', error.message);
  }
}

checkSchema();