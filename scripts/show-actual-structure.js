const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function showActualStructure() {
  console.log('🔍 Finding actual table structure...\n');

  try {
    // Get existing vessel
    const { data: vessels } = await supabase
      .from('vessels')
      .select('*')
      .limit(1);

    const vessel = vessels[0];
    console.log('📊 VESSELS columns:', Object.keys(vessel));

    // Try inserting with just the minimum we know works
    console.log('\n🧪 Testing tem_pollock_landings with minimal data...');

    // Try different combinations to discover required fields
    const attempts = [
      { vessel_id: vessel.id, landing_date: '2025-01-01', pounds: 280000 },
      { vessel_id: vessel.id, landing_date: '2025-01-01', pollock_pounds: 280000 },
      { vessel_id: vessel.id, date: '2025-01-01', pounds: 280000 },
      { vessel_id: vessel.id, landing_date: '2025-01-01', pounds: 280000, processor_id: 'test' }
    ];

    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i];
      console.log(`   Attempt ${i + 1}: ${JSON.stringify(attempt)}`);

      const { data, error } = await supabase
        .from('tem_pollock_landings')
        .insert(attempt)
        .select()
        .single();

      if (error) {
        console.log(`   ❌ ${error.message}`);
      } else {
        console.log(`   ✅ SUCCESS! Columns:`, Object.keys(data));

        // Clean up the test record
        await supabase
          .from('tem_pollock_landings')
          .delete()
          .eq('id', data.id);

        break;
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

showActualStructure();