const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsersTable() {
  console.log('🔍 Checking Users Table for Supabase Auth Compatibility...\n');

  try {
    // Try to get the current structure
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Error accessing users table:', error.message);
      return;
    }

    console.log('✅ Users table exists');
    console.log('📋 Current structure (empty table sample):');

    // Get a better view of the structure by trying various approaches
    console.log('\n🧪 Testing table structure...');

    // Test 1: Try inserting a record with minimal data
    const testId = '00000000-0000-0000-0000-000000000001'; // Test UUID
    const { data: insertTest, error: insertError } = await supabase
      .from('users')
      .insert({
        id: testId,
        email: 'test@example.com',
        role: 'vessel'
      })
      .select()
      .single();

    if (insertError) {
      console.log('❌ Insert test failed:', insertError.message);
      console.log('   Details:', insertError.details || 'No additional details');

      if (insertError.message.includes('foreign key')) {
        console.log('\n🚨 ISSUE FOUND: Users table not linked to Supabase Auth!');
        console.log('   The id field should reference auth.users(id)');
      }
    } else {
      console.log('✅ Insert test succeeded');
      console.log('   Columns:', Object.keys(insertTest).join(', '));

      // Clean up test record
      await supabase.from('users').delete().eq('id', testId);
    }

    console.log('\n📋 REQUIRED CHANGES FOR SUPABASE AUTH:');
    console.log('=====================================');
    console.log('The users table needs to be recreated to properly integrate with Supabase Auth.');
    console.log('\n🔧 SQL to fix the users table:');
    console.log(`
-- First, drop the existing users table
DROP TABLE IF EXISTS users CASCADE;

-- Create new users table that properly references Supabase Auth
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('vessel', 'tem_manager', 'rockfish_manager', 'admin')),
  vessel_id UUID REFERENCES vessels(id), -- Only for vessel users
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create index for performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_vessel ON users(vessel_id) WHERE vessel_id IS NOT NULL;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see their own record, admins see all
CREATE POLICY users_access ON users
FOR ALL USING (
  id = auth.uid()
  OR
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);
    `);

    console.log('\n⚠️  IMPORTANT: This will delete any existing user data!');
    console.log('   Make sure to backup any important user records first.');

  } catch (error) {
    console.error('❌ Error checking users table:', error.message);
  }
}

checkUsersTable();