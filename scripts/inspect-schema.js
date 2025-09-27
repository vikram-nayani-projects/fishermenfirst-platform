const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectSchema() {
  console.log('🔍 Inspecting Supabase Database Schema...\n');

  try {
    // Get all tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return;
    }

    console.log('📋 EXISTING TABLES:');
    console.log('==================');
    tables.forEach(table => {
      console.log(`• ${table.table_name} (${table.table_type})`);
    });

    console.log('\n🏗️  TABLE STRUCTURES:');
    console.log('=====================\n');

    // Get detailed schema for each table
    for (const table of tables) {
      if (table.table_type === 'BASE TABLE') {
        console.log(`📊 ${table.table_name.toUpperCase()}`);
        console.log('─'.repeat(50));

        // Get columns
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default, character_maximum_length')
          .eq('table_schema', 'public')
          .eq('table_name', table.table_name)
          .order('ordinal_position');

        if (columnsError) {
          console.error(`Error fetching columns for ${table.table_name}:`, columnsError);
          continue;
        }

        columns.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          console.log(`  ${col.column_name}: ${col.data_type}${maxLength} ${nullable}${defaultVal}`);
        });

        console.log('');
      }
    }

    // Check for RLS policies
    console.log('🔒 ROW LEVEL SECURITY POLICIES:');
    console.log('===============================');

    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, roles, cmd, qual')
      .order('tablename');

    if (policiesError) {
      console.log('Could not fetch RLS policies (this is normal if none exist)');
    } else if (policies && policies.length > 0) {
      policies.forEach(policy => {
        console.log(`• ${policy.tablename}: ${policy.policyname} (${policy.cmd})`);
        if (policy.qual) {
          console.log(`  Condition: ${policy.qual}`);
        }
      });
    } else {
      console.log('No RLS policies found');
    }

    // Check for foreign key relationships
    console.log('\n🔗 FOREIGN KEY RELATIONSHIPS:');
    console.log('=============================');

    const { data: fkeys, error: fkeysError } = await supabase
      .from('information_schema.table_constraints')
      .select(`
        table_name,
        constraint_name,
        constraint_type
      `)
      .eq('table_schema', 'public')
      .eq('constraint_type', 'FOREIGN KEY')
      .order('table_name');

    if (fkeysError) {
      console.log('Could not fetch foreign keys');
    } else if (fkeys && fkeys.length > 0) {
      fkeys.forEach(fk => {
        console.log(`• ${fk.table_name}: ${fk.constraint_name}`);
      });
    } else {
      console.log('No foreign key constraints found');
    }

    console.log('\n✅ Schema inspection complete!');

  } catch (error) {
    console.error('Error inspecting schema:', error);
  }
}

inspectSchema();