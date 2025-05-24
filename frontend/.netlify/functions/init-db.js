// Database initialization for Netlify environment
const { Pool } = require('pg');

// Database connection with error handling
async function createPool() {
  try {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.warn('No DATABASE_URL provided. Skipping database initialization.');
      return null;
    }
    
    return new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
  } catch (error) {
    console.error('Error creating database pool:', error.message);
    return null;
  }
}

// Initialize database
async function initDb() {
  console.log('Initializing database in Netlify environment...');
  
  const pool = await createPool();
  if (!pool) {
    return {
      statusCode: 200, // Return 200 to not fail build
      body: JSON.stringify({ message: 'Database initialization skipped due to connection issues' })
    };
  }
  
  let client;
  try {
    client = await pool.connect();
    
    // Create users table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
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
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    
    console.log('Database initialized successfully');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Database initialized successfully' })
    };
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    
    // Don't fail the build if DATABASE_URL isn't set correctly or DB is unavailable
    if (process.env.SKIP_DB_INIT_ON_ERROR === 'true') {
      console.log('Continuing despite database initialization failure (SKIP_DB_INIT_ON_ERROR=true)');
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Database initialization was attempted but failed. Build continuing as SKIP_DB_INIT_ON_ERROR is set.',
          error: error.message
        })
      };
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Database initialization failed', details: error.message })
    };
  } finally {
    if (client) {
      client.release();
    }
    if (pool) {
      await pool.end().catch(e => console.warn('Error closing pool:', e.message));
    }
  }
}

// Handler for Netlify Functions
exports.handler = async function() {
  try {
    // Add CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Content-Type': 'application/json'
    };
    
    const response = await initDb();
    return {
      ...response,
      headers
    };
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 200, // Return 200 to not fail build
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: 'Function encountered an error but will not fail the build',
        error: error.message 
      })
    };
  }
}; 