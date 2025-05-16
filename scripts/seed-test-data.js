// Seeds mock/test data into the database using a small subset of data_new.json
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Connect to the database using environment variables
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Create a lightweight version of the data for testing
async function seedTestData() {
  console.log('Seeding lightweight test data...');
  
  try {
    // Read the original data file
    const dataPath = path.resolve(__dirname, '../data_new.json');
    const allData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Extract just 2 frameworks for testing
    const testData = allData.slice(0, 2);
    
    console.log(`Selected ${testData.length} frameworks for test data`);
    
    // Create the table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS compliance_frameworks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        jurisdiction TEXT,
        domains TEXT[],
        region TEXT,
        requirement TEXT,
        effective_date DATE,
        last_updated DATE,
        official_url TEXT,
        category TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Clear existing test data
    await pool.query('DELETE FROM compliance_frameworks');
    
    // Insert the lightweight test data
    for (const framework of testData) {
      await pool.query(
        `INSERT INTO compliance_frameworks 
        (name, type, description, jurisdiction, domains, region, requirement, 
         effective_date, last_updated, official_url, category)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          framework.name,
          framework.type,
          framework.description,
          framework.jurisdiction,
          framework.domains,
          framework.region,
          framework.requirement,
          framework.effective_date,
          framework.last_updated,
          framework.official_url,
          framework.category
        ]
      );
      console.log(`Inserted test framework: ${framework.name}`);
    }
    
    console.log('Test data seeding completed successfully');
  } catch (error) {
    console.error('Error seeding test data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the seeding function
seedTestData();
