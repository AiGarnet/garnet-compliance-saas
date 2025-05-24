/**
 * Database initialization script for both local and Netlify environments
 * Run with: node scripts/init-db.js
 */

require('dotenv').config();
const { Pool } = require('pg');

// Check if database URL is available
const DATABASE_URL = process.env.DATABASE_URL;

async function initDb() {
  // If no database URL is provided, just warn and exit successfully
  if (!DATABASE_URL) {
    console.warn('No DATABASE_URL provided. Skipping database initialization.');
    return;
  }

  console.log('Initializing database...');
  
  // Create database connection
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

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
  } catch (error) {
    console.error('Error initializing database:', error.message);
    
    // Don't fail the build if database initialization fails
    console.log('Continuing build process despite database initialization failure');
  } finally {
    if (client) {
      client.release();
    }
    await pool.end().catch(e => console.warn('Error closing pool:', e.message));
  }
}

// Run the initialization
initDb().catch(err => {
  console.error('Unhandled error in database initialization:', err);
  // Continue with build even if DB init fails
  console.log('Continuing build process despite database initialization failure');
}); 