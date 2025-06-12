const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkVendorAnswersStructure() {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to database successfully');

    // Check vendor_questionnaire_answers table structure
    const vendorAnswersQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'vendor_questionnaire_answers'
      ORDER BY ordinal_position;
    `;
    
    const vendorAnswersStructure = await client.query(vendorAnswersQuery);
    console.log('vendor_questionnaire_answers table structure:');
    vendorAnswersStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check sample data
    const sampleQuery = `
      SELECT vendor_id, id, question, answer
      FROM vendor_questionnaire_answers
      LIMIT 3;
    `;
    
    try {
      const sample = await client.query(sampleQuery);
      console.log('\nSample vendor questionnaire answers:');
      sample.rows.forEach(row => {
        console.log(`- Vendor: ${row.vendor_id}, Answer ID: ${row.id}`);
        console.log(`  Question: ${row.question}`);
        console.log(`  Answer: ${row.answer}`);
      });
    } catch (error) {
      console.log('Error getting sample data:', error.message);
    }

    // Check answers table structure too
    const answersQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'answers'
      ORDER BY ordinal_position;
    `;
    
    const answersStructure = await client.query(answersQuery);
    console.log('\nanswers table structure:');
    answersStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check if we need to add vendor_id to evidence_files table
    console.log('\n--- RECOMMENDATION ---');
    console.log('Current evidence_files table links to answer_id (UUID)');
    console.log('We should either:');
    console.log('1. Use answer_id to link evidence to specific questionnaire answers');
    console.log('2. Add vendor_id to evidence_files for direct vendor-evidence relationship');
    console.log('3. Create both relationships for flexibility');

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

checkVendorAnswersStructure(); 