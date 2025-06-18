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
    const migrationPath = path.join(__dirname, 'migrations/006_ultra_simple_structure.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔄 Executing ultra-simple migration...');
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
    
    // Check sample data
    console.log('🔍 Sample data:');
    const sampleResult = await client.query(`
      SELECT vendor_id, question_id, question, status, created_at 
      FROM vendor_questionnaire_answers 
      ORDER BY created_at DESC 
      LIMIT 5;
    `);
    
    console.log('📋 Recent records:');
    sampleResult.rows.forEach(row => {
      console.log(`  Vendor ${row.vendor_id}: ${row.question_id} - ${row.question.substring(0, 50)}...`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

runMigration(); 