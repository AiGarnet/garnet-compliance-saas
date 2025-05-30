// Script to check if data is being saved in the waitlist table
require('dotenv').config();
const { Pool } = require('pg');

// Database connection string from environment variable or hardcoded for testing
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway';

// Create a new PostgreSQL client
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for some PostgreSQL providers
  }
});

async function checkWaitlistData() {
  console.log('Checking waitlist data in the database...');
  console.log('Connection string (masked):', connectionString.replace(/\/\/.+?@/, '//****:****@'));
  
  const client = await pool.connect();
  
  try {
    // Check if waitlist table exists
    console.log('\nChecking if waitlist table exists...');
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'waitlist'
      );
    `);
    
    const tableExists = tableCheckResult.rows[0].exists;
    console.log('Waitlist table exists:', tableExists);
    
    if (!tableExists) {
      console.log('\nWaitlist table does not exist! Please run create-waitlist-table.js first.');
      return;
    }
    
    // Get table structure
    console.log('\nGetting waitlist table structure:');
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'waitlist'
      ORDER BY ordinal_position;
    `);
    
    console.table(columnsResult.rows);
    
    // Count records
    console.log('\nCounting records in waitlist table:');
    const countResult = await client.query('SELECT COUNT(*) FROM waitlist;');
    const recordCount = parseInt(countResult.rows[0].count);
    
    console.log(`Total records in waitlist table: ${recordCount}`);
    
    if (recordCount === 0) {
      console.log('\nThe waitlist table is empty. No data has been saved yet.');
      return;
    }
    
    // Get the most recent entries
    console.log('\nRetrieving the 10 most recent waitlist entries:');
    const recentEntries = await client.query(`
      SELECT * FROM waitlist
      ORDER BY created_at DESC
      LIMIT 10;
    `);
    
    // Display entries with password masked
    console.log('\nMost recent waitlist entries:');
    const maskedEntries = recentEntries.rows.map(entry => {
      const maskedEntry = {...entry};
      if (maskedEntry.password) {
        maskedEntry.password = '********'; // Mask password for security
      }
      return maskedEntry;
    });
    
    console.table(maskedEntries);
    
    // Check for duplicates
    console.log('\nChecking for duplicate email entries:');
    const duplicateCheck = await client.query(`
      SELECT email, COUNT(*) 
      FROM waitlist 
      GROUP BY email 
      HAVING COUNT(*) > 1;
    `);
    
    if (duplicateCheck.rows.length > 0) {
      console.log('Found duplicate emails:');
      console.table(duplicateCheck.rows);
    } else {
      console.log('No duplicate emails found.');
    }
    
    // Check if any records are missing required fields
    console.log('\nChecking for records with missing required fields:');
    const missingFieldsCheck = await client.query(`
      SELECT id, email, 
             CASE WHEN full_name IS NULL THEN 'Missing' ELSE 'Present' END as full_name,
             CASE WHEN password IS NULL THEN 'Missing' ELSE 'Present' END as password,
             CASE WHEN role IS NULL THEN 'Missing' ELSE 'Present' END as role,
             CASE WHEN organization IS NULL THEN 'Missing' ELSE 'Present' END as organization
      FROM waitlist
      WHERE full_name IS NULL OR password IS NULL OR role IS NULL;
    `);
    
    if (missingFieldsCheck.rows.length > 0) {
      console.log('Found records with missing required fields:');
      console.table(missingFieldsCheck.rows);
    } else {
      console.log('All records have the required fields filled.');
    }
    
  } catch (error) {
    console.error('Error checking waitlist data:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
checkWaitlistData().catch(err => {
  console.error('Fatal error in check-waitlist-data script:', err);
  process.exit(1);
}); 