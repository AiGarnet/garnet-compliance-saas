/**
 * Database migration script to create a clean waitlist table
 */
const { Pool } = require('pg');
require('dotenv').config();

// Parse command line arguments
const args = process.argv.slice(2);
const dbParams = {};

args.forEach(arg => {
  const [key, value] = arg.split('=');
  if (key && value) {
    dbParams[key.replace('--', '')] = value;
  }
});

// Use connection string if provided
const connectionString = dbParams.connectionString || process.env.DATABASE_URL;

// Create connection pool with connection string or individual params
let pool;
if (connectionString) {
  console.log('Using database connection string');
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
} else {
  const host = dbParams.host || process.env.DB_HOST || 'localhost';
  const port = dbParams.port || process.env.DB_PORT || '5432';
  console.log(`Connecting to database at ${host}:${port}`);
  pool = new Pool({
    host,
    port: parseInt(port),
    database: dbParams.database || process.env.DB_NAME || 'garnet_ai',
    user: dbParams.user || process.env.DB_USER || 'postgres',
    password: dbParams.password || process.env.DB_PASSWORD || '',
    ssl: (dbParams.ssl === 'true' || process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production') 
      ? { rejectUnauthorized: false } 
      : false,
  });
}

async function createWaitlistTable() {
  const client = await pool.connect();
  
  try {
    console.log('Creating clean waitlist table...');
    
    // Check if waitlist table exists
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'waitlist'
      );
    `;
    
    const tableExistsResult = await client.query(tableExistsQuery);
    const tableExists = tableExistsResult.rows[0].exists;
    
    if (tableExists) {
      console.log('Dropping existing waitlist table...');
      await client.query('DROP TABLE waitlist;');
      console.log('Existing waitlist table dropped');
    }
    
    // Create new waitlist table with clean schema
    console.log('Creating new waitlist table...');
    const createTableQuery = `
      CREATE TABLE waitlist (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(100),
        organization VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Create index on email for faster lookups
      CREATE INDEX waitlist_email_idx ON waitlist(email);
      
      -- Create index on created_at for sorting
      CREATE INDEX waitlist_created_at_idx ON waitlist(created_at);
      
      -- Create index on role for statistics
      CREATE INDEX waitlist_role_idx ON waitlist(role);
    `;
    
    await client.query(createTableQuery);
    console.log('New waitlist table created successfully!');
    
    // Display the table structure
    const structureQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'waitlist' 
      ORDER BY ordinal_position
    `;
    const structureResult = await client.query(structureQuery);
    
    console.log('\nWaitlist table structure:');
    structureResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}) ${row.column_default ? `[default: ${row.column_default}]` : ''}`);
    });
    
  } catch (error) {
    console.error('Error creating waitlist table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
createWaitlistTable()
  .then(() => {
    console.log('\nMigration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 