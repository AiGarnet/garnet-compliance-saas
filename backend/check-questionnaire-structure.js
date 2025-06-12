const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkQuestionnaireStructure() {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to database successfully');

    // Check questionnaire_answers table structure
    const answersTableQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'questionnaire_answers'
      ORDER BY ordinal_position;
    `;
    
    const answersStructure = await client.query(answersTableQuery);
    console.log('Questionnaire answers table structure:');
    answersStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });

    // Check if there's a direct way to link evidence files to vendors
    console.log('\n--- Checking relationship options ---');
    
    // Option 1: Can we link evidence_files to vendors through questionnaire_answers?
    const relationshipQuery = `
      SELECT qa.vendor_id, qa.id as answer_id
      FROM questionnaire_answers qa
      LIMIT 5;
    `;
    
    try {
      const relationships = await client.query(relationshipQuery);
      console.log('\nSample questionnaire_answers with vendor relationships:');
      relationships.rows.forEach(row => {
        console.log(`- Answer ID: ${row.answer_id}, Vendor ID: ${row.vendor_id}`);
      });
    } catch (error) {
      console.log('Could not find vendor_id in questionnaire_answers:', error.message);
    }

    // Check all table names to understand the complete schema
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const tables = await client.query(tablesQuery);
    console.log('\nAll tables in the database:');
    tables.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

checkQuestionnaireStructure(); 