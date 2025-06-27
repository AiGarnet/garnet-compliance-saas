const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '016_add_supporting_doc_metadata.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration 016: Add Supporting Document Metadata Fields...');
    await client.query(migrationSQL);
    console.log('✅ Migration 016 completed successfully');

    // Verify the new columns exist
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'checklist_supporting_documents' 
      AND column_name IN ('description', 'category')
      ORDER BY column_name;
    `;

    const result = await client.query(verifyQuery);
    console.log('\n📋 New columns in checklist_supporting_documents table:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });

    // Check index creation
    const indexQuery = `
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'checklist_supporting_documents' 
      AND indexname = 'idx_supporting_docs_category';
    `;

    const indexResult = await client.query(indexQuery);
    if (indexResult.rows.length > 0) {
      console.log('\n🔍 Index created successfully:');
      console.log(`- ${indexResult.rows[0].indexname}: ${indexResult.rows[0].indexdef}`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

runMigration(); 