// Script to drop the waitlist table
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

async function dropWaitlistTable() {
  console.log('WARNING: This script will drop the waitlist table!');
  console.log('Connection string (masked):', connectionString.replace(/\/\/.+?@/, '//****:****@'));
  console.log('Connected to Railway deployment: https://garnet-compliance-saas-production.up.railway.app/');
  
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
    
    if (tableExists) {
      console.log('\nDropping waitlist table...');
      await client.query('DROP TABLE waitlist CASCADE;');
      console.log('Waitlist table has been dropped successfully.');
      
      // Verify table was dropped
      const verifyResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'waitlist'
        );
      `);
      
      const stillExists = verifyResult.rows[0].exists;
      console.log('Waitlist table exists after drop attempt:', stillExists);
      
      if (!stillExists) {
        console.log('\nTable was successfully dropped. You can now run the create-waitlist-table script to recreate it.');
      } else {
        console.log('\nERROR: Failed to drop the table for some reason.');
      }
    } else {
      console.log('\nWaitlist table does not exist, nothing to drop.');
    }
    
  } catch (error) {
    console.error('Error dropping waitlist table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
dropWaitlistTable().catch(err => {
  console.error('Fatal error in drop-waitlist-table script:', err);
  process.exit(1);
}); 