// Script to manually create the waitlist table
require('dotenv').config();
const { Pool } = require('pg');

// Database connection string from environment variable or hardcoded for testing
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway';

// Create a new PostgreSQL client
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for some Postgres providers
  }
});

async function createWaitlistTable() {
  console.log('Creating waitlist table in the database...');
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
      console.log('\nWaitlist table already exists. Do you want to drop it and recreate? (Not doing it automatically for safety)');
      console.log('If you want to drop and recreate, run this SQL:');
      console.log('DROP TABLE waitlist; -- Be careful with this!');
    } else {
      // Create the waitlist table with common fields
      console.log('\nCreating waitlist table with standard fields...');
      await client.query(`
        CREATE TABLE waitlist (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          company TEXT,
          role TEXT,
          interests TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_waitlist_email ON waitlist(email);
      `);
      
      console.log('Waitlist table created successfully with these fields:');
      console.log('- id (UUID, primary key)');
      console.log('- email (TEXT, unique, required)');
      console.log('- name (TEXT)');
      console.log('- company (TEXT)');
      console.log('- role (TEXT)');
      console.log('- interests (TEXT)');
      console.log('- created_at (TIMESTAMP)');
      
      // Verify table was created
      const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'waitlist'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nTable structure:');
      console.table(columnsResult.rows);
    }
    
    console.log('\nDatabase operation completed successfully!');
    console.log('The waitlist API is deployed at: https://garnet-compliance-saas-production.up.railway.app/join-waitlist');
    
  } catch (error) {
    console.error('Error creating waitlist table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
createWaitlistTable().catch(err => {
  console.error('Fatal error in create-waitlist-table script:', err);
  process.exit(1);
}); 