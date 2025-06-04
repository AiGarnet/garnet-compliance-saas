/**
 * Database migration script to update the users table for waitlist
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

async function updateUsersTable() {
  const client = await pool.connect();
  
  try {
    console.log('Updating users table for waitlist...');
    
    // Check if the users table exists
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `;
    
    const tableExistsResult = await client.query(tableExistsQuery);
    const tableExists = tableExistsResult.rows[0].exists;
    
    if (!tableExists) {
      console.log('Users table does not exist. Migration skipped.');
      return;
    }

    // Check if we need to modify the password_hash column to be nullable
    const checkColumnQuery = `
      SELECT is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'password_hash';
    `;
    
    const columnResult = await client.query(checkColumnQuery);
    
    if (columnResult.rows.length > 0 && columnResult.rows[0].is_nullable === 'NO') {
      // Make password_hash nullable
      console.log('Modifying password_hash to be optional...');
      await client.query(`
        ALTER TABLE users 
        ALTER COLUMN password_hash DROP NOT NULL;
      `);
      console.log('password_hash column updated to be nullable');
    } else {
      console.log('password_hash is already nullable or does not exist');
    }
    
    // Check if we need to add a source column
    const sourceColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'source';
    `;
    
    const sourceColumnResult = await client.query(sourceColumnQuery);
    
    if (sourceColumnResult.rows.length === 0) {
      // Add source column
      console.log('Adding source column...');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN source VARCHAR(50);
      `);
      console.log('source column added successfully');
    } else {
      console.log('source column already exists');
    }
    
    // Check if we need to add a signup_date column
    const signupDateColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'signup_date';
    `;
    
    const signupDateColumnResult = await client.query(signupDateColumnQuery);
    
    if (signupDateColumnResult.rows.length === 0) {
      // Add signup_date column
      console.log('Adding signup_date column...');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN signup_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      `);
      console.log('signup_date column added successfully');
    } else {
      console.log('signup_date column already exists');
    }
    
    console.log('Users table updated successfully!');
    
  } catch (error) {
    console.error('Error updating users table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
updateUsersTable()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 