// Test database connection script
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

async function testConnection() {
  console.log('Testing database connection...');
  console.log('Connection string (masked):', connectionString.replace(/\/\/.+?@/, '//****:****@'));
  
  const client = await pool.connect();
  
  try {
    // Test the connection by querying the database version
    console.log('Connected to database. Querying PostgreSQL version...');
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    
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
    
    // If table exists, show its structure
    if (tableExists) {
      console.log('\nFetching waitlist table columns:');
      const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'waitlist'
        ORDER BY ordinal_position;
      `);
      
      console.table(columnsResult.rows);
      
      // Count entries in waitlist
      const countResult = await client.query('SELECT COUNT(*) FROM waitlist');
      console.log(`\nTotal waitlist entries: ${countResult.rows[0].count}`);
      
      // Show sample data (first 5 rows)
      if (parseInt(countResult.rows[0].count) > 0) {
        console.log('\nSample waitlist entries (up to 5):');
        const sampleResult = await client.query('SELECT * FROM waitlist LIMIT 5');
        console.table(sampleResult.rows);
      }
    } else {
      console.log('\nWaitlist table does not exist yet. It will be created when the server runs or on first request.');
    }
    
    console.log('\nDatabase connection test completed successfully!');
    
  } catch (error) {
    console.error('Error testing database connection:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test
testConnection().catch(err => {
  console.error('Fatal error in database test:', err);
  process.exit(1);
}); 