const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createMissingTable() {
  console.log('🏗️  Creating tem_four_trip_calculations table...\n');

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS tem_four_trip_calculations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vessel_id UUID REFERENCES vessels(id) NOT NULL,
      calculation_date DATE NOT NULL,
      trip_group_start_date DATE NOT NULL,
      trip_group_end_date DATE NOT NULL,
      trip_count INTEGER NOT NULL CHECK (trip_count BETWEEN 1 AND 4),
      total_pounds INTEGER NOT NULL CHECK (total_pounds >= 0),
      average_pounds DECIMAL(10,2) NOT NULL CHECK (average_pounds >= 0),
      is_compliant BOOLEAN NOT NULL,
      is_egregious BOOLEAN NOT NULL DEFAULT FALSE,
      violation_threshold INTEGER DEFAULT 300000,
      egregious_threshold INTEGER DEFAULT 335000,
      season_year INTEGER NOT NULL,
      landing_ids UUID[] NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),

      UNIQUE(vessel_id, calculation_date),

      CONSTRAINT valid_average CHECK (
        ABS(average_pounds - (total_pounds::DECIMAL / trip_count)) < 0.01
      ),

      CONSTRAINT valid_compliance CHECK (
        (is_compliant = (average_pounds <= violation_threshold)) AND
        (is_egregious = (average_pounds > egregious_threshold))
      )
    );
  `;

  try {
    // Create the table
    const { error: createError } = await supabase.rpc('exec', { sql: createTableSQL });

    if (createError) {
      console.log('Direct SQL failed, trying alternative method...');

      // Try using a stored procedure approach
      const { error: altError } = await supabase
        .from('tem_four_trip_calculations')
        .select('id')
        .limit(1);

      if (altError && altError.message.includes('does not exist')) {
        console.log('❌ Table does not exist and cannot be created via JS client');
        console.log('   You may need to run this SQL directly in Supabase dashboard:');
        console.log('\n' + createTableSQL);
        return;
      } else if (!altError) {
        console.log('✅ Table already exists!');
      }
    } else {
      console.log('✅ Table created successfully!');
    }

    // Create indexes
    console.log('📊 Creating indexes...');

    const indexSQL = [
      'CREATE INDEX IF NOT EXISTS idx_tem_four_trip_vessel_date ON tem_four_trip_calculations(vessel_id, calculation_date);',
      'CREATE INDEX IF NOT EXISTS idx_tem_four_trip_season ON tem_four_trip_calculations(season_year);',
      'CREATE INDEX IF NOT EXISTS idx_tem_four_trip_compliance ON tem_four_trip_calculations(is_compliant, is_egregious);'
    ];

    for (const sql of indexSQL) {
      const { error } = await supabase.rpc('exec', { sql });
      if (error) {
        console.log(`Index creation failed: ${error.message}`);
      }
    }

    // Test the table
    console.log('\n🧪 Testing table access...');
    const { data, error } = await supabase
      .from('tem_four_trip_calculations')
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ Table test failed: ${error.message}`);
    } else {
      console.log('✅ Table is accessible and ready for use!');
    }

  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    console.log('\n📋 Manual SQL to run in Supabase dashboard:');
    console.log(createTableSQL);
  }
}

createMissingTable();