// Netlify serverless function to manually set up the database schema
const { Client } = require('pg');

exports.handler = async function(event, context) {
  // Add CORS headers for all responses
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET requests with admin password
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse query parameters
    const params = event.queryStringParameters || {};
    
    // Security check - require admin password
    const adminPassword = process.env.ADMIN_PASSWORD || 'garnet-admin';
    const providedPassword = params.password;
    
    if (providedPassword !== adminPassword) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized access' })
      };
    }

    // Get the action to perform
    const action = params.action || 'status';
    
    // Connect to the database
    const result = await setupDatabase(action);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error in manual-db-setup function:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};

async function setupDatabase(action) {
  const connectionString = process.env.DATABASE_URL;
  
  // Log connection attempt (mask sensitive info)
  const maskedConnectionString = connectionString ? 
    connectionString.replace(/\/\/(.+?)@/, '//****:****@') : 'not set';
  console.log('Attempting database connection with:', maskedConnectionString);
  
  if (!connectionString) {
    return {
      success: false,
      error: 'DATABASE_URL environment variable not set'
    };
  }
  
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Database connection successful!');
    
    const results = {
      success: true,
      actions: []
    };
    
    // Check existing tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    results.existingTables = existingTables;
    console.log('Existing tables:', existingTables);
    
    // Create users table if it doesn't exist or if force create is specified
    if (action === 'create-users-table' || action === 'setup-all') {
      const usersTableExists = existingTables.includes('users');
      
      if (usersTableExists && action !== 'setup-all') {
        results.actions.push({
          action: 'create-users-table',
          status: 'skipped',
          message: 'Users table already exists'
        });
      } else {
        // Drop table if it exists and we're doing a forced setup
        if (usersTableExists) {
          console.log('Dropping existing users table...');
          await client.query('DROP TABLE IF EXISTS users CASCADE');
          results.actions.push({
            action: 'drop-users-table',
            status: 'success',
            message: 'Dropped existing users table'
          });
        }
        
        console.log('Creating users table...');
        await client.query(`
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
        
        results.actions.push({
          action: 'create-users-table',
          status: 'success',
          message: 'Created users table'
        });
      }
    }
    
    // Insert test user if requested
    if (action === 'insert-test-user' || action === 'setup-all') {
      // Generate a UUID for the test user
      const testUserId = require('crypto').randomUUID();
      const testEmail = 'test@garnetai.com';
      
      // Check if test user already exists
      const userCheckResult = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [testEmail]
      );
      
      if (userCheckResult.rows.length > 0) {
        console.log('Test user already exists, skipping...');
        results.actions.push({
          action: 'insert-test-user',
          status: 'skipped',
          message: 'Test user already exists'
        });
      } else {
        // Create metadata
        const metadata = {
          signup_source: 'manual_setup',
          signup_date: new Date().toISOString()
        };
        
        // Insert test user
        console.log('Inserting test user...');
        await client.query(
          `INSERT INTO users (
            id, email, password_hash, full_name, role, organization, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            testUserId,
            testEmail,
            'dGVzdHBhc3N3b3Jk', // Base64 of 'testpassword'
            'Test User',
            'admin',
            'GARNET AI',
            JSON.stringify(metadata)
          ]
        );
        
        results.actions.push({
          action: 'insert-test-user',
          status: 'success',
          message: 'Inserted test user'
        });
      }
    }
    
    // Get updated table list
    const updatedTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    const updatedTables = updatedTablesResult.rows.map(row => row.table_name);
    results.updatedTables = updatedTables;
    
    // Count users in the table
    if (updatedTables.includes('users')) {
      const countResult = await client.query('SELECT COUNT(*) FROM users');
      results.userCount = parseInt(countResult.rows[0].count);
      
      // List all users if requested
      if (action === 'list-users' || action === 'setup-all') {
        const usersResult = await client.query(`
          SELECT id, email, full_name, role, organization, created_at
          FROM users
          ORDER BY created_at DESC
        `);
        
        results.users = usersResult.rows;
      }
    }
    
    await client.end();
    console.log('Database connection closed');
    
    return results;
  } catch (error) {
    console.error('Database error:', error);
    
    try {
      await client.end();
    } catch (e) {
      // Ignore
    }
    
    return {
      success: false,
      error: error.message
    };
  }
} 