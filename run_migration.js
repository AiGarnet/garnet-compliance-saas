const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Railway database');
    
    // Read and execute the migration
    const migrationPath = path.join(__dirname, 'migrations/005_simplify_questionnaire_structure.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔄 Executing migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully');
    
    // Verify the changes
    console.log('🔍 Verifying table structure...');
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'vendor_questionnaire_answers' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📊 Current table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

runMigration(); 