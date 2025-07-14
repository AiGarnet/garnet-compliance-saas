const { Client } = require('pg');

// Database connection using the provided credentials
const client = new Client({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function cleanDatabase() {
  try {
    console.log('🧹 Starting database cleanup...');
    await client.connect();
    console.log('✅ Connected to database');

    // Get all table names except waitlist
    const tablesQuery = `
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != 'waitlist'
      ORDER BY tablename;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    const tables = tablesResult.rows.map(row => row.tablename);
    
    console.log(`📋 Found ${tables.length} tables to clean (excluding waitlist)`);
    
    // Count records before cleanup
    console.log('\n📊 Records before cleanup:');
    for (const table of tables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
        const count = countResult.rows[0].count;
        console.log(`  ${table}: ${count} records`);
      } catch (error) {
        console.log(`  ${table}: Error counting (${error.message})`);
      }
    }

    // Disable foreign key constraints temporarily
    console.log('\n🔒 Disabling foreign key constraints...');
    await client.query('SET session_replication_role = replica;');

    // Clean tables in reverse dependency order to avoid foreign key issues
    const cleanupOrder = [
      // Supporting documents and evidence first
      'checklist_supporting_documents',
      'evidence_files',
      'trust_portal_feedback_responses',
      'trust_portal_shared_documents',
      'trust_portal_submissions',
      'trust_portal_feedback',
      'trust_portal_items',
      
      // Checklist related
      'checklist_questions',
      'checklists',
      
      // Vendor related
      'vendor_works',
      'vendor_questionnaire_answers',
      'vendor_invite_tokens',
      'vendors',
      
      // User related
      'activities',
      'subscriptions',
      'users',
      
      // Organizations
      'organizations',
      
      // Other tables
      'questionnaire_questions',
      'questionnaires',
      'audit_log',
      'compliance_frameworks'
    ];

    console.log('\n🗑️  Cleaning tables...');
    let totalCleaned = 0;

    for (const table of cleanupOrder) {
      if (tables.includes(table)) {
        try {
          const result = await client.query(`DELETE FROM "${table}"`);
          const deletedCount = result.rowCount || 0;
          totalCleaned += deletedCount;
          console.log(`  ✅ ${table}: ${deletedCount} records deleted`);
        } catch (error) {
          console.log(`  ❌ ${table}: Error - ${error.message}`);
        }
      }
    }

    // Clean any remaining tables that weren't in the cleanup order
    for (const table of tables) {
      if (!cleanupOrder.includes(table)) {
        try {
          const result = await client.query(`DELETE FROM "${table}"`);
          const deletedCount = result.rowCount || 0;
          totalCleaned += deletedCount;
          console.log(`  ✅ ${table}: ${deletedCount} records deleted`);
        } catch (error) {
          console.log(`  ❌ ${table}: Error - ${error.message}`);
        }
      }
    }

    // Re-enable foreign key constraints
    console.log('\n🔓 Re-enabling foreign key constraints...');
    await client.query('SET session_replication_role = DEFAULT;');

    // Reset sequences for tables with SERIAL primary keys
    console.log('\n🔄 Resetting sequences...');
    const sequenceResetQueries = [
      "SELECT setval('vendors_vendor_id_seq', 1, false);",
      "SELECT setval('trust_portal_items_id_seq', 1, false);",
      "SELECT setval('trust_portal_shared_documents_id_seq', 1, false);",
      "SELECT setval('trust_portal_feedback_id_seq', 1, false);",
      "SELECT setval('trust_portal_feedback_responses_id_seq', 1, false);",
      "SELECT setval('vendor_invite_tokens_id_seq', 1, false);"
    ];

    for (const query of sequenceResetQueries) {
      try {
        await client.query(query);
        console.log(`  ✅ Sequence reset: ${query.split("'")[1]}`);
      } catch (error) {
        // Sequence might not exist, that's okay
        console.log(`  ⚠️  Sequence skip: ${query.split("'")[1]} (${error.message})`);
      }
    }

    // Verify cleanup
    console.log('\n📊 Records after cleanup:');
    for (const table of tables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
        const count = countResult.rows[0].count;
        console.log(`  ${table}: ${count} records`);
      } catch (error) {
        console.log(`  ${table}: Error counting (${error.message})`);
      }
    }

    // Check waitlist table to confirm it wasn't touched
    const waitlistCount = await client.query('SELECT COUNT(*) as count FROM waitlist');
    console.log(`\n📬 Waitlist table preserved: ${waitlistCount.rows[0].count} subscribers`);

    console.log(`\n🎉 Database cleanup completed! Total records cleaned: ${totalCleaned}`);
    console.log('📋 Waitlist table was preserved as requested');

  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the cleanup if this file is executed directly
if (require.main === module) {
  cleanDatabase()
    .then(() => {
      console.log('✅ Cleanup script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Cleanup script failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanDatabase }; 