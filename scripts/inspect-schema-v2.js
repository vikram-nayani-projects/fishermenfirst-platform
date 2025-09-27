const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectSchema() {
  console.log('🔍 Inspecting Supabase Database Schema...\n');

  try {
    // Try direct SQL query to get tables
    const { data: tables, error: tablesError } = await supabase.rpc('get_tables');

    if (tablesError) {
      console.log('RPC failed, trying alternative method...');

      // Try using the SQL method
      const { data: sqlResult, error: sqlError } = await supabase
        .from('pg_tables')
        .select('tablename, schemaname')
        .eq('schemaname', 'public');

      if (sqlError) {
        console.log('pg_tables failed, trying direct connection...');

        // Last resort - try a simple query to see what we can access
        const { data: testData, error: testError } = await supabase
          .from('users')
          .select('*')
          .limit(1);

        if (testError) {
          console.log('No users table found. Let me check what tables exist by trying common ones...');

          // Try common table names based on our spec
          const tablesToCheck = [
            'users',
            'vessels',
            'tem_pollock_landings',
            'rp_quota_allocations',
            'tem_violations',
            'rp_quota_transfers'
          ];

          console.log('📋 CHECKING FOR EXPECTED TABLES:');
          console.log('================================');

          for (const tableName of tablesToCheck) {
            try {
              const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);

              if (error) {
                console.log(`❌ ${tableName}: Not found or no access`);
              } else {
                console.log(`✅ ${tableName}: EXISTS (${data.length} rows sampled)`);

                // If we found data, let's see the structure
                if (data.length > 0) {
                  console.log(`   Sample columns: ${Object.keys(data[0]).join(', ')}`);
                }
              }
            } catch (err) {
              console.log(`❌ ${tableName}: Error - ${err.message}`);
            }
          }

        } else {
          console.log(`✅ Found users table with ${testData.length} records`);
          if (testData.length > 0) {
            console.log('   Columns:', Object.keys(testData[0]).join(', '));
          }
        }

      } else {
        console.log('📋 TABLES FROM pg_tables:');
        console.log('=========================');
        sqlResult.forEach(table => {
          console.log(`• ${table.tablename}`);
        });
      }

    } else {
      console.log('📋 TABLES FROM RPC:');
      console.log('===================');
      console.log(tables);
    }

    console.log('\n✅ Schema inspection complete!');

  } catch (error) {
    console.error('Error inspecting schema:', error.message);
  }
}

inspectSchema();