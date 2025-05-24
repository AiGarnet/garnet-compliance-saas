// Netlify serverless function to view waitlist data and diagnose database connectivity
const fs = require('fs');
const path = require('path');
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

  // Only allow GET requests
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
    const action = params.action || 'status';
    
    // Security check - require a simple admin password
    // In production, use proper authentication
    const adminPassword = process.env.ADMIN_PASSWORD || 'garnet-admin';
    const providedPassword = params.password;
    
    if (providedPassword !== adminPassword) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized access' })
      };
    }

    let responseData = {};

    // Check database connection
    if (action === 'db-status' || action === 'status') {
      const dbStatus = await checkDatabaseConnection();
      responseData.database = dbStatus;
    }

    // Read local waitlist data
    if (action === 'local-data' || action === 'status') {
      const localData = await readLocalWaitlistData();
      responseData.localData = localData;
    }

    // Read database waitlist data
    if (action === 'db-data') {
      const dbData = await readDatabaseWaitlistData();
      responseData.databaseData = dbData;
    }
    
    // Test database connection by creating a test record
    if (action === 'test-connection') {
      const testResult = await testDatabaseConnection();
      responseData.testResult = testResult;
    }

    // Get environment variables (sanitized)
    if (action === 'env') {
      responseData.environment = {
        NODE_VERSION: process.env.NODE_VERSION,
        NETLIFY: process.env.NETLIFY,
        DATABASE_URL_SET: !!process.env.DATABASE_URL,
        DEPLOY_URL: process.env.DEPLOY_URL,
        CONTEXT: process.env.CONTEXT
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseData)
    };
  } catch (error) {
    console.error('Error in waitlist-admin function:', error);
    
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

// Helper function to check database connection
async function checkDatabaseConnection() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    return {
      connected: false,
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
    await client.connect();
    
    // Get database version
    const versionResult = await client.query('SELECT version()');
    const version = versionResult.rows[0].version;
    
    // Check if users table exists
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    const usersTableExists = tableCheckResult.rows[0].exists;
    
    // Count users if table exists
    let userCount = 0;
    if (usersTableExists) {
      const countResult = await client.query('SELECT COUNT(*) FROM users');
      userCount = parseInt(countResult.rows[0].count);
    }
    
    await client.end();
    
    return {
      connected: true,
      version,
      usersTableExists,
      userCount
    };
  } catch (error) {
    try {
      await client.end();
    } catch (e) {
      // Ignore
    }
    
    return {
      connected: false,
      error: error.message
    };
  }
}

// Helper function to read local waitlist data
async function readLocalWaitlistData() {
  try {
    const dataFilePath = path.join('/tmp', 'waitlist-data.json');
    
    if (!fs.existsSync(dataFilePath)) {
      return {
        exists: false,
        count: 0,
        data: []
      };
    }
    
    const fileData = fs.readFileSync(dataFilePath, 'utf8');
    const waitlistData = JSON.parse(fileData);
    
    return {
      exists: true,
      count: waitlistData.length,
      data: waitlistData
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message
    };
  }
}

// Helper function to read waitlist data from database
async function readDatabaseWaitlistData() {
  const connectionString = process.env.DATABASE_URL;
  
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
    await client.connect();
    
    // Check if users table exists
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    const usersTableExists = tableCheckResult.rows[0].exists;
    
    if (!usersTableExists) {
      await client.end();
      return {
        success: false,
        error: 'Users table does not exist'
      };
    }
    
    // Get all users
    const result = await client.query(`
      SELECT id, email, full_name, role, organization, metadata, created_at 
      FROM users
      ORDER BY created_at DESC
    `);
    
    await client.end();
    
    return {
      success: true,
      count: result.rows.length,
      users: result.rows
    };
  } catch (error) {
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

// Helper function to test database connection
async function testDatabaseConnection() {
  const connectionString = process.env.DATABASE_URL;
  
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
    await client.connect();
    
    // Create test UUID
    const testId = require('crypto').randomUUID();
    const testEmail = `test-${testId.slice(0, 8)}@example.com`;
    const passwordHash = Buffer.from('testpassword123').toString('base64');
    
    console.log('Attempting to create test user with ID:', testId);
    
    // Check if users table exists
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    const tableExists = tableCheckResult.rows[0].exists;
    
    // Create users table if it doesn't exist
    if (!tableExists) {
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
    }
    
    // Insert a test record
    const result = await client.query(`
      INSERT INTO users (
        id, email, password_hash, full_name, role, organization, metadata
      ) 
      VALUES (
        $1, $2, $3, $4, $5, $6, $7
      )
      RETURNING id, email, full_name, role;
    `, [
      testId,
      testEmail,
      passwordHash,
      'Test User',
      'user',
      'Test Organization',
      JSON.stringify({ test: 'data', created_via: 'admin-test' })
    ]);
    
    await client.end();
    
    return {
      success: true,
      testUser: result.rows[0]
    };
  } catch (error) {
    console.error('Test connection error:', error);
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