const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableColumns() {
  console.log('🔍 Checking actual table columns...\n');

  const tables = [
    'vessels',
    'tem_pollock_landings',
    'tem_four_trip_calculations',
    'users'
  ];

  for (const tableName of tables) {
    console.log(`📊 ${tableName.toUpperCase()}:`);

    try {
      // Try to get table info by attempting a select with limit 0
      const { data, error } = await supabase
        .from(tableName)
        .select()
        .limit(0);

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✅ Table exists (empty result as expected)`);
      }

      // Try a simple insert to see what columns are required
      const { error: insertError } = await supabase
        .from(tableName)
        .insert({})
        .select();

      if (insertError) {
        console.log(`   📋 Required columns from error: ${insertError.message}`);
      }

    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }
    console.log('');
  }
}

checkTableColumns();