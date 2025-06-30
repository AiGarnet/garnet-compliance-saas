const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Use the provided connection string
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway';

const pool = new Pool({ connectionString });

async function validateSchema() {
  console.log('🔍 Validating database schema...');
  
  try {
    // First, check which tables exist
    console.log('\n📊 Checking existing tables:');
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`Found ${tables.length} tables in the database`);
    tables.forEach(table => {
      console.log(`- ${table}`);
    });
    
    // Check foreign keys
    console.log('\n📊 Checking foreign key constraints:');
    const foreignKeys = await pool.query(`
      SELECT 
        conname AS constraint_name,
        conrelid::regclass AS table_name,
        confrelid::regclass AS referenced_table,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE contype = 'f'
      ORDER BY conrelid::regclass::text, conname;
    `);
    
    console.log(`Found ${foreignKeys.rows.length} foreign key constraints`);
    foreignKeys.rows.slice(0, 10).forEach(fk => {
      console.log(`- ${fk.constraint_name}: ${fk.table_name} -> ${fk.referenced_table}`);
    });
    if (foreignKeys.rows.length > 10) {
      console.log(`  ... and ${foreignKeys.rows.length - 10} more`);
    }
    
    // Check indexes
    console.log('\n📊 Checking indexes:');
    const indexes = await pool.query(`
      SELECT 
        indexname AS index_name,
        tablename AS table_name,
        indexdef AS index_definition
      FROM pg_indexes
      WHERE indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `);
    
    console.log(`Found ${indexes.rows.length} indexes`);
    indexes.rows.slice(0, 10).forEach(idx => {
      console.log(`- ${idx.index_name} on ${idx.table_name}`);
    });
    if (indexes.rows.length > 10) {
      console.log(`  ... and ${indexes.rows.length - 10} more`);
    }
    
    // Check for orphaned records only if tables exist
    console.log('\n📊 Checking for orphaned records:');
    
    // Check if questionnaire_questions table exists
    if (tables.includes('questionnaire_questions') && tables.includes('questionnaires')) {
      // Check questionnaire_questions with no questionnaire
      const orphanedQuestions = await pool.query(`
        SELECT COUNT(*) FROM questionnaire_questions qq
        LEFT JOIN questionnaires q ON qq.questionnaire_id = q.id
        WHERE q.id IS NULL;
      `);
      
      console.log(`- Orphaned questionnaire questions: ${orphanedQuestions.rows[0].count}`);
    } else {
      console.log('⚠️ Skipping questionnaire_questions check - table does not exist');
    }
    
    // Check if vendor_works table exists
    if (tables.includes('vendor_works') && tables.includes('vendors')) {
      // Check vendor_works with no vendor
      const orphanedWorks = await pool.query(`
        SELECT COUNT(*) FROM vendor_works vw
        LEFT JOIN vendors v ON vw.vendor_id = v.vendor_id
        WHERE v.vendor_id IS NULL;
      `);
      
      console.log(`- Orphaned vendor works: ${orphanedWorks.rows[0].count}`);
    } else {
      console.log('⚠️ Skipping vendor_works check - table does not exist');
    }
    
    // Check if trust_portal_submissions table exists
    if (tables.includes('trust_portal_submissions') && tables.includes('vendors')) {
      // Check trust_portal_submissions with no vendor
      const orphanedSubmissions = await pool.query(`
        SELECT COUNT(*) FROM trust_portal_submissions tps
        LEFT JOIN vendors v ON tps.vendor_id = v.vendor_id
        WHERE v.vendor_id IS NULL;
      `);
      
      console.log(`- Orphaned trust portal submissions: ${orphanedSubmissions.rows[0].count}`);
    } else {
      console.log('⚠️ Skipping trust_portal_submissions check - table does not exist');
    }
    
    // Check for tables with missing timestamps
    console.log('\n📊 Checking for tables missing timestamp columns:');
    const tablesWithoutTimestamps = await pool.query(`
      SELECT 
        table_name,
        has_created_at,
        has_updated_at,
        CASE 
          WHEN has_created_at AND has_updated_at THEN 'Both timestamps exist'
          WHEN has_created_at THEN 'Only created_at exists'
          WHEN has_updated_at THEN 'Only updated_at exists'
          ELSE 'No timestamps'
        END AS timestamp_status
      FROM (
        SELECT 
          table_name,
          bool_or(column_name = 'created_at') AS has_created_at,
          bool_or(column_name = 'updated_at') AS has_updated_at
        FROM information_schema.columns
        WHERE table_schema = 'public'
        GROUP BY table_name
      ) AS t
      WHERE NOT (has_created_at AND has_updated_at)
      ORDER BY table_name;
    `);
    
    console.log(`Found ${tablesWithoutTimestamps.rows.length} tables missing timestamp columns:`);
    tablesWithoutTimestamps.rows.forEach(table => {
      console.log(`- ${table.table_name}: ${table.timestamp_status}`);
    });
    
    console.log('\n✅ Schema validation completed!');
    
  } catch (error) {
    console.error('❌ Schema validation failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  validateSchema()
    .then(() => {
      console.log('🎉 Schema validation finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Schema validation failed:', error);
      process.exit(1);
    });
}

module.exports = { validateSchema }; 