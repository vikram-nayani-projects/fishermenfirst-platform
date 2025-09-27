const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllTables() {
  console.log('🔍 Checking All Expected Tables from Data Model...\n');

  // All tables from our data-model.md specification
  const expectedTables = [
    // Core tables
    'users',
    'vessels',
    'vessel_program_participation',

    // TEM tables (tem_ prefix)
    'tem_pollock_landings',
    'tem_four_trip_calculations',
    'tem_violations',
    'tem_landing_corrections',

    // Rockfish tables (rp_ prefix)
    'rp_quota_allocations',
    'rp_quota_transfers',
    'rp_pollock_landings',
    'rp_salmon_bycatch',

    // System tables
    'audit_logs',
    'file_storage'
  ];

  console.log('📋 TABLE VERIFICATION RESULTS:');
  console.log('==============================\n');

  const existingTables = [];
  const missingTables = [];

  for (const tableName of expectedTables) {
    try {
      // Try to query the table
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
        missingTables.push(tableName);
      } else {
        console.log(`✅ ${tableName}: EXISTS (${data.length} rows)`);
        existingTables.push({
          name: tableName,
          rowCount: data.length,
          sampleData: data[0] || null
        });

        // Show column structure if we have sample data
        if (data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log(`   📊 Columns (${columns.length}): ${columns.join(', ')}`);
        } else {
          // Try to get just the column names with a more specific query
          try {
            const { data: emptyData, error: emptyError } = await supabase
              .from(tableName)
              .select('*')
              .limit(0);

            if (!emptyError) {
              console.log(`   📊 Table exists but empty`);
            }
          } catch (e) {
            console.log(`   📊 Could not determine columns`);
          }
        }
        console.log('');
      }
    } catch (err) {
      console.log(`❌ ${tableName}: Exception - ${err.message}`);
      missingTables.push(tableName);
    }
  }

  console.log('\n📊 SUMMARY:');
  console.log('===========');
  console.log(`✅ Existing tables: ${existingTables.length}`);
  console.log(`❌ Missing tables: ${missingTables.length}`);

  if (existingTables.length > 0) {
    console.log('\n✅ FOUND TABLES:');
    existingTables.forEach(table => {
      console.log(`   • ${table.name}`);
    });
  }

  if (missingTables.length > 0) {
    console.log('\n❌ MISSING TABLES:');
    missingTables.forEach(table => {
      console.log(`   • ${table}`);
    });
  }

  // Let's also check what program type each table should serve
  console.log('\n🏷️  TABLE CATEGORIZATION:');
  console.log('=========================');

  const temTables = existingTables.filter(t => t.name.startsWith('tem_'));
  const rockfishTables = existingTables.filter(t => t.name.startsWith('rp_'));
  const coreTables = existingTables.filter(t => !t.name.startsWith('tem_') && !t.name.startsWith('rp_'));

  console.log(`🐟 TEM Program tables: ${temTables.length}`);
  temTables.forEach(t => console.log(`   • ${t.name}`));

  console.log(`🪨 Rockfish Program tables: ${rockfishTables.length}`);
  rockfishTables.forEach(t => console.log(`   • ${t.name}`));

  console.log(`⚙️  Core/Shared tables: ${coreTables.length}`);
  coreTables.forEach(t => console.log(`   • ${t.name}`));
}

checkAllTables();