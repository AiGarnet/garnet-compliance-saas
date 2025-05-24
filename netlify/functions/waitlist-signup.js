const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');

// Initialize PostgreSQL connection pool
const createPool = () => {
  // Check if DATABASE_URL exists
  if (!process.env.DATABASE_URL) {
    console.warn('No DATABASE_URL environment variable found');
    return null;
  }

  // For Netlify deployment, we need to enable SSL
  const isProduction = process.env.NODE_ENV === 'production';
  
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false
  });
};

// Create user in database
const createUser = async (userData) => {
  const pool = createPool();
  if (!pool) {
    throw new Error('Database connection not available');
  }

  const client = await pool.connect();
  try {
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    
    // Generate UUID for user id
    const userId = uuidv4();
    
    // Insert user into database
    const query = `
      INSERT INTO users (
        id, email, password_hash, full_name, role, organization, 
        is_active, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
      RETURNING id, email, full_name, role, organization, created_at, updated_at
    `;
    
    const values = [
      userId,
      userData.email.toLowerCase(),
      hashedPassword,
      userData.full_name,
      userData.role,
      userData.organization || null,
      true, // is_active
      new Date() // Both created_at and updated_at
    ];
    
    console.log('Executing database query on Netlify...');
    const result = await client.query(query, values);
    console.log('User created successfully in database on Netlify');
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    // Check for duplicate email (unique constraint violation)
    if (error.code === '23505') {
      throw new Error('Email already registered');
    }
    throw error;
  } finally {
    client.release();
  }
};

// Check if user exists
const userExists = async (email) => {
  const pool = createPool();
  if (!pool) {
    throw new Error('Database connection not available');
  }

  const client = await pool.connect();
  try {
    const query = 'SELECT id FROM users WHERE email = $1';
    const result = await client.query(query, [email.toLowerCase()]);
    return result.rows.length > 0;
  } finally {
    client.release();
  }
};

// Netlify serverless function to handle waitlist signup
// This will proxy the request to the Railway backend

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    // Parse the incoming request body
    const userData = JSON.parse(event.body);
    console.log('Received signup request for:', userData.email);

    // Forward the request to the Railway backend
    const backendUrl = 'https://garnet-compliance-saas-production.up.railway.app/api/waitlist/signup';
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    // Get the response data
    const responseData = await response.json();
    
    // Return the response with appropriate status
    return {
      statusCode: response.status,
      body: JSON.stringify(responseData),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    console.error('Error forwarding request to backend:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error forwarding request to backend' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}; 