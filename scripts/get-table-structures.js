const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getTableStructures() {
  console.log('🔍 Getting Detailed Table Structures...\n');

  const existingTables = [
    'users',
    'vessels',
    'tem_pollock_landings',
    'tem_violations',
    'rp_quota_allocations',
    'rp_quota_transfers',
    'rp_salmon_bycatch'
  ];

  for (const tableName of existingTables) {
    console.log(`📊 ${tableName.toUpperCase()}`);
    console.log('═'.repeat(60));

    try {
      // Insert a test record to understand the structure
      let testRecord = {};

      if (tableName === 'vessels') {
        testRecord = {
          name: 'Test Vessel Schema Check',
          registration_number: 'TEST-SCHEMA',
          length_feet: 65,
          vessel_type: 'TEST'
        };
      } else if (tableName === 'users') {
        testRecord = {
          email: 'schema-test@example.com'
        };
      } else {
        // For other tables, we'll just try to insert minimal data
        testRecord = {};
      }

      // Try to insert to see what fields are required/available
      const { data: insertResult, error: insertError } = await supabase
        .from(tableName)
        .insert(testRecord)
        .select()
        .single();

      if (insertError) {
        console.log(`❌ Insert test failed: ${insertError.message}`);

        // If insert failed, try to get existing data instead
        const { data: existingData, error: selectError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (!selectError && existingData && existingData.length > 0) {
          console.log('📋 Structure from existing data:');
          const sample = existingData[0];
          Object.entries(sample).forEach(([key, value]) => {
            const type = typeof value;
            const sqlType = value === null ? 'NULL' :
                          type === 'string' ? 'TEXT' :
                          type === 'number' ? 'NUMERIC' :
                          type === 'boolean' ? 'BOOLEAN' :
                          value instanceof Date ? 'TIMESTAMP' : 'UNKNOWN';
            console.log(`  ${key}: ${sqlType} = ${JSON.stringify(value)}`);
          });
        } else {
          console.log('📋 No existing data and could not insert test data');
          console.log('❌ Error details:', insertError.details || insertError.hint || 'No additional details');
        }
      } else {
        console.log('✅ Structure from successful insert:');
        Object.entries(insertResult).forEach(([key, value]) => {
          const type = typeof value;
          const sqlType = value === null ? 'NULL' :
                        type === 'string' ? 'TEXT' :
                        type === 'number' ? 'NUMERIC' :
                        type === 'boolean' ? 'BOOLEAN' :
                        value instanceof Date ? 'TIMESTAMP' : 'UNKNOWN';
          console.log(`  ${key}: ${sqlType} = ${JSON.stringify(value)}`);
        });

        // Clean up test record
        await supabase
          .from(tableName)
          .delete()
          .eq('id', insertResult.id);
      }

    } catch (error) {
      console.log(`❌ Error analyzing ${tableName}:`, error.message);
    }

    console.log('\n');
  }
}

getTableStructures();