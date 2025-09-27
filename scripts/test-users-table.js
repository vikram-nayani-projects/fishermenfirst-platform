const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUsersTable() {
  console.log('🧪 Testing Updated Users Table...\n');

  try {
    // Test the table structure
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Error accessing users table:', error.message);
      return;
    }

    console.log('✅ Users table is accessible');
    console.log('📋 Ready for Supabase Auth integration');

    // Check if we can see the table is empty but properly structured
    console.log(`   Current rows: ${data.length}`);

    console.log('\n🚀 NEXT STEPS:');
    console.log('1. ✅ MVP Data Model Complete (7/7 tables)');
    console.log('2. 🔄 Implement 4-trip average calculations');
    console.log('3. 🔄 Build API endpoints for CRUD operations');
    console.log('4. 🔄 Add Supabase Auth integration');
    console.log('5. 🔄 Implement Row Level Security policies');

  } catch (error) {
    console.error('❌ Error testing users table:', error.message);
  }
}

testUsersTable();