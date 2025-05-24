const { Pool } = require('pg');

exports.handler = async function(event, context) {
  console.log('Setting up database in Netlify environment...');
  
  // Check if DATABASE_URL exists
  if (!process.env.DATABASE_URL) {
    console.warn('No DATABASE_URL environment variable found');
    return {
      statusCode: 200, // Return 200 to not fail the build
      body: JSON.stringify({ message: 'Database setup skipped (no DATABASE_URL)' })
    };
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Netlify to connect to external PostgreSQL
  });
  
  try {
    // Test connection
    const connectionTest = await pool.query('SELECT NOW()');
    console.log('PostgreSQL connection successful:', connectionTest.rows[0].now);
    
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    console.log('Users table exists:', tableExists);
    
    if (!tableExists) {
      console.log('Creating users table...');
      await pool.query(`
        CREATE TABLE users (
          id UUID PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          role TEXT NOT NULL,
          organization TEXT,
          metadata JSONB DEFAULT '{}'::jsonb,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_users_email ON users(email);
      `);
      console.log('Users table created successfully');
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Database setup completed successfully',
        tableCreated: !tableExists
      })
    };
  } catch (error) {
    console.error('Error setting up database:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to setup database',
        message: error.message
      })
    };
  } finally {
    await pool.end();
  }
}; 