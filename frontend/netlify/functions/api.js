// Simplified Netlify function for authentication
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { SignJWT } = require('jose');
const { TextEncoder } = require('util');

// Secret key for JWT tokens
const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-key-change-this-in-production';
const JWT_EXPIRY = '7d';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Helper for database queries
async function executeQuery(text, params = []) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

// User database operations
const userDb = {
  // Find user by email
  async findUserByEmail(email) {
    const result = await executeQuery(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  },
  
  // Create new user
  async createUser(userData) {
    const { id, email, password_hash, full_name, role, organization } = userData;
    
    const result = await executeQuery(
      `INSERT INTO users (id, email, password_hash, full_name, role, organization)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, full_name, role, organization, created_at, updated_at`,
      [id, email.toLowerCase(), password_hash, full_name, role, organization]
    );
    
    return result.rows[0];
  }
};

// Generate JWT token
async function generateToken(payload) {
  const encoder = new TextEncoder();
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(encoder.encode(JWT_SECRET));
}

// Handler for signup requests
async function handleSignup(event) {
  try {
    const { email, password, full_name, role, organization } = JSON.parse(event.body);
    
    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields: email, password, full_name, and role are required' 
        })
      };
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid email format' })
      };
    }
    
    // Validate password strength
    if (password.length < 8) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Password must be at least 8 characters long' })
      };
    }
    
    // Check if user already exists
    const existingUser = await userDb.findUserByEmail(email);
    if (existingUser) {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: 'Email already registered' })
      };
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user ID
    const userId = require('crypto').randomUUID();
    
    // Save user to database
    const user = await userDb.createUser({
      id: userId,
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      full_name,
      role,
      organization: organization || null
    });
    
    // Generate JWT token
    const token = await generateToken({ id: user.id, email: user.email });
    
    // Return success response
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Successfully signed up!',
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          organization: user.organization,
          created_at: user.created_at
        }
      })
    };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process signup request' })
    };
  }
}

// Handler for login requests
async function handleLogin(event) {
  try {
    const { email, password } = JSON.parse(event.body);
    
    // Validate required fields
    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email and password are required' })
      };
    }
    
    // Find user by email
    const user = await userDb.findUserByEmail(email);
    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid email or password' })
      };
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid email or password' })
      };
    }
    
    // Generate JWT token
    const token = await generateToken({ id: user.id, email: user.email });
    
    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          organization: user.organization,
          created_at: user.created_at
        }
      })
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process login request' })
    };
  }
}

// Main handler function
exports.handler = async function(event, context) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };
  
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  try {
    // Get the path from the event
    const path = event.path;
    console.log('Function called with path:', path);
    
    // Route to appropriate handler
    let response;
    if (path.includes('/api/auth/signup')) {
      response = await handleSignup(event);
    } else if (path.includes('/api/auth/login')) {
      response = await handleLogin(event);
    } else {
      response = {
        statusCode: 404,
        body: JSON.stringify({ error: 'Route not found' })
      };
    }
    
    // Add CORS headers to response
    return {
      ...response,
      headers: { ...headers, ...response.headers }
    };
  } catch (error) {
    console.error('API function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
}; 