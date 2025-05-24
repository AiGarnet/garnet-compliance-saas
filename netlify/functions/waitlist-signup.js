const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Initialize PostgreSQL connection pool
const createPool = () => {
  // Check if DATABASE_URL exists
  if (!process.env.DATABASE_URL) {
    console.warn('No DATABASE_URL environment variable found');
    return null;
  }

  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
    
    const result = await client.query(query, values);
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

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse the request body
    const data = JSON.parse(event.body);
    const { email, password, full_name, role, organization } = data;

    // Basic validation
    if (!email || !password || !full_name || !role) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Check if user already exists
    const exists = await userExists(email);
    if (exists) {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: 'Email already registered' }),
      };
    }

    // Create new user
    const newUser = await createUser({
      email,
      password,
      full_name,
      role,
      organization
    });

    // Return success response
    return {
      statusCode: 201,
      body: JSON.stringify({ 
        message: 'Successfully joined the waitlist!',
        user: newUser
      }),
    };
  } catch (error) {
    console.error('Error processing waitlist signup:', error);
    // Handle specific errors
    if (error.message === 'Email already registered') {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: error.message }),
      };
    } else if (error.message === 'Database connection not available') {
      return {
        statusCode: 503,
        body: JSON.stringify({ error: 'Database service unavailable' }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error processing your request' }),
    };
  }
}; 