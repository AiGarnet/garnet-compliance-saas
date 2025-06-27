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
    const migrationPath = path.join(__dirname, 'migrations/007_add_question_title_column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔄 Executing migration to add question_title column...');
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully');
    
    // Verify the changes
    console.log('🔍 Verifying table structure...');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'vendor_questionnaire_answers' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📊 Updated table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check sample data with question_title
    console.log('🔍 Sample data with question_title:');
    const sampleResult = await client.query(`
      SELECT vendor_id, question_title, question, LEFT(answer, 50) as answer_preview, created_at 
      FROM vendor_questionnaire_answers 
      WHERE question_title IS NOT NULL
      ORDER BY created_at DESC 
      LIMIT 5;
    `);
    
    console.log('📋 Recent records with question_title:');
    sampleResult.rows.forEach(row => {
      console.log(`  Vendor ${row.vendor_id}: "${row.question_title}" - ${row.question.substring(0, 30)}...`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

runMigration(); 