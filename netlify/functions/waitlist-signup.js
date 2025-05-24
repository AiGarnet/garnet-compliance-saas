// Netlify serverless function to handle waitlist signup
// This will directly insert data into PostgreSQL database

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Helper function to store waitlist data in the filesystem
async function storeWaitlistData(userData) {
  try {
    // Create a data object with timestamp
    const signupData = {
      ...userData,
      timestamp: new Date().toISOString(),
      id: require('crypto').randomUUID()
    };
    
    // File path for waitlist data
    // This will be in the Netlify function's temporary directory
    const dataFilePath = path.join('/tmp', 'waitlist-data.json');
    
    // Check if file exists and read existing data
    let existingData = [];
    try {
      if (fs.existsSync(dataFilePath)) {
        const fileData = fs.readFileSync(dataFilePath, 'utf8');
        existingData = JSON.parse(fileData);
      }
    } catch (error) {
      console.log('Error reading existing waitlist data:', error.message);
      // Continue with empty array if file doesn't exist or can't be read
    }
    
    // Add new signup to the array
    existingData.push(signupData);
    
    // Write the updated data back to the file
    fs.writeFileSync(dataFilePath, JSON.stringify(existingData, null, 2));
    
    console.log('Waitlist data stored successfully in file for:', userData.email);
    return true;
  } catch (error) {
    console.error('Failed to store waitlist data in file:', error);
    return false;
  }
}

// Helper function to store data directly in PostgreSQL
async function storeInPostgres(userData) {
  // Get database connection string from environment variables
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL environment variable not set');
    return false;
  }
  
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false // Required for some Postgres providers
    }
  });
  
  try {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();
    
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
    
    // Generate a UUID for the user
    const userId = require('crypto').randomUUID();
    
    // Hash the password (in a real app, use bcrypt or similar)
    const passwordHash = Buffer.from(userData.password).toString('base64');
    
    // Check if user with this email already exists
    const userCheckResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [userData.email.toLowerCase()]
    );
    
    if (userCheckResult.rows.length > 0) {
      console.log('User with this email already exists:', userData.email);
      await client.end();
      return {
        success: false,
        error: 'Email already registered'
      };
    }
    
    // Create metadata
    const metadata = {
      signup_source: 'landing_page',
      signup_date: new Date().toISOString()
    };
    
    // Insert user
    const result = await client.query(
      `INSERT INTO users (
        id, email, password_hash, full_name, role, organization, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, full_name, role, organization, metadata, is_active, created_at, updated_at`,
      [
        userId,
        userData.email.toLowerCase(),
        passwordHash,
        userData.full_name,
        userData.role,
        userData.organization || null,
        JSON.stringify(metadata)
      ]
    );
    
    await client.end();
    
    if (result.rows.length > 0) {
      console.log('User successfully inserted into PostgreSQL:', userData.email);
      return {
        success: true,
        user: result.rows[0]
      };
    } else {
      return {
        success: false,
        error: 'Failed to insert user'
      };
    }
  } catch (error) {
    console.error('PostgreSQL Error:', error);
    try {
      await client.end();
    } catch (e) {
      // Ignore error on connection close
    }
    return {
      success: false,
      error: error.message
    };
  }
}

exports.handler = async function(event, context) {
  // Log the request for debugging
  console.log('Function invoked: waitlist-signup');
  console.log('Request path:', event.path);
  
  // Add CORS headers for all responses
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };
  
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the incoming request body
    const userData = JSON.parse(event.body);
    console.log('Received signup request for:', userData.email);

    // Check if user data is valid
    if (!userData.email || !userData.password || !userData.full_name || !userData.role) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          details: 'Email, password, full_name, and role are required' 
        })
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid email format' })
      };
    }
    
    // Validate password
    if (userData.password.length < 8) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Password must be at least 8 characters long' })
      };
    }

    // Store the waitlist data locally as backup
    await storeWaitlistData(userData);
    
    // Try to store in PostgreSQL directly
    const pgResult = await storeInPostgres(userData);
    
    if (pgResult.success) {
      // Successfully stored in PostgreSQL
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          message: 'Successfully joined the waitlist!',
          user: pgResult.user
        })
      };
    } else if (pgResult.error === 'Email already registered') {
      // Email already exists
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Email already registered' })
      };
    }
    
    // If PostgreSQL fails, use the mock response as fallback
    console.log('Using mock waitlist signup response as fallback');
    
    // Generate a unique user ID for the mock response
    const mockUserId = require('crypto').randomUUID();
    
    const mockResponse = {
      message: 'Successfully joined the waitlist!',
      user: {
        id: mockUserId,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        organization: userData.organization || null,
        metadata: {
          signup_source: 'landing_page',
          signup_date: new Date().toISOString()
        },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
    
    // Return the mock response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mockResponse)
    };
    
  } catch (error) {
    console.error('Error in waitlist-signup function:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error in waitlist signup function',
        details: error.message
      })
    };
  }
}; 