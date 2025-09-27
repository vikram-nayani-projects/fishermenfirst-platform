const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyMVPTables() {
  console.log('🔍 Verifying MVP Tables Status...\n');

  // The 6 essential MVP tables
  const mvpTables = [
    {
      name: 'vessels',
      purpose: 'Vessel identification and basic info',
      critical: 'Foundation for all programs'
    },
    {
      name: 'tem_pollock_landings',
      purpose: 'TEM trip data for 4-trip calculations',
      critical: 'Core TEM business logic input'
    },
    {
      name: 'tem_four_trip_calculations',
      purpose: 'Rolling 4-trip averages for compliance',
      critical: 'Core TEM business rule enforcement'
    },
    {
      name: 'rp_quota_allocations',
      purpose: 'Annual quota allocations by vessel/species',
      critical: 'Rockfish quota management foundation'
    },
    {
      name: 'rp_quota_transfers',
      purpose: 'Quota movements between vessels',
      critical: 'Enables quota trading and overages'
    },
    {
      name: 'rp_salmon_bycatch',
      purpose: 'Salmon bycatch monitoring',
      critical: 'Regulatory compliance for salmon protection'
    }
  ];

  console.log('📋 MVP TABLE VERIFICATION:');
  console.log('═'.repeat(80));

  let existingCount = 0;
  let missingCount = 0;
  const missingTables = [];
  const existingTables = [];

  for (const table of mvpTables) {
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${table.name}`);
        console.log(`   Purpose: ${table.purpose}`);
        console.log(`   Critical: ${table.critical}`);
        console.log(`   Error: ${error.message}`);
        missingTables.push(table);
        missingCount++;
      } else {
        console.log(`✅ ${table.name}`);
        console.log(`   Purpose: ${table.purpose}`);
        console.log(`   Rows: ${data.length} (sampled)`);
        if (data.length > 0) {
          console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
        }
        existingTables.push(table);
        existingCount++;
      }
      console.log('');
    } catch (err) {
      console.log(`❌ ${table.name}: Exception - ${err.message}\n`);
      missingTables.push(table);
      missingCount++;
    }
  }

  console.log('📊 MVP READINESS SUMMARY:');
  console.log('═'.repeat(50));
  console.log(`✅ Existing tables: ${existingCount}/6 (${Math.round(existingCount/6*100)}%)`);
  console.log(`❌ Missing tables: ${missingCount}/6`);

  if (existingCount === 6) {
    console.log('\n🎉 MVP DATA MODEL COMPLETE!');
    console.log('   All essential tables exist and are ready for use.');
    console.log('   You can now implement the core business logic.');
  } else {
    console.log('\n⚠️  MVP BLOCKED - Missing Critical Tables:');
    missingTables.forEach(table => {
      console.log(`   • ${table.name}: ${table.critical}`);
    });

    if (missingTables.some(t => t.name === 'tem_four_trip_calculations')) {
      console.log('\n🚨 CRITICAL: tem_four_trip_calculations missing!');
      console.log('   This table is essential for TEM compliance.');
      console.log('   Please run the SQL from docs/MVP_DATA_MODEL.md');
    }
  }

  console.log('\n🏗️  NEXT STEPS:');
  console.log('   1. Create missing tables (see MVP_DATA_MODEL.md)');
  console.log('   2. Test basic CRUD operations');
  console.log('   3. Implement 4-trip average calculations');
  console.log('   4. Build simple API endpoints');
}

verifyMVPTables();