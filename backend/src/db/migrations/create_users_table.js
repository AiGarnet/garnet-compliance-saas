/**
 * Database migration script to create the users table
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'garnet_ai',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Sonasuhani1',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function createUsersTable() {
  const client = await pool.connect();
  
  try {
    console.log('Creating users table if it does not exist...');
    
    // Check if users table exists
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `;
    
    const tableExistsResult = await client.query(tableExistsQuery);
    const tableExists = tableExistsResult.rows[0].exists;
    
    if (tableExists) {
      console.log('Users table already exists. Migration skipped.');
      return;
    }
    
    // Create users table
    const createTableQuery = `
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL,
        organization VARCHAR(255),
        metadata JSONB DEFAULT '{}'::jsonb,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Create index on email for faster lookups
      CREATE INDEX users_email_idx ON users(email);
      
      -- Create index on role for statistics queries
      CREATE INDEX users_role_idx ON users(role);
    `;
    
    await client.query(createTableQuery);
    console.log('Users table created successfully!');
    
  } catch (error) {
    console.error('Error creating users table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
createUsersTable()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 