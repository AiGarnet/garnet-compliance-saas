require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8080;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: {
    rejectUnauthorized: false // Required for some PostgreSQL providers
  }
});

// Middleware
app.use(cors({
  origin: [
    'https://garnet-compliance-saas-production.up.railway.app',
    'https://testinggarnet.netlify.app',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers));
  if (req.method !== 'GET') {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  console.log('==================================================');
  next();
});

// Authentication endpoints

// Authentication signup endpoint
app.post('/api/auth/signup', async (req, res) => {
  console.log('Received auth signup request at:', new Date().toISOString());
  console.log('Request body:', req.body);
  
  const client = await pool.connect();
  
  try {
    const { email, password, full_name, role, organization, source } = req.body;
    
    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, password, full_name, and role are required' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    
    // Validate role
    if (!['vendor', 'enterprise'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either "vendor" or "enterprise"' });
    }
    
    // Check if user already exists
    const existingUserQuery = 'SELECT id FROM users WHERE email = $1';
    const existingUserResult = await client.query(existingUserQuery, [email.toLowerCase()]);
    
    if (existingUserResult.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const bcrypt = require('bcryptjs');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert new user
    const insertUserQuery = `
      INSERT INTO users (
        email, 
        password_hash, 
        full_name, 
        role, 
        organization, 
        source, 
        signup_date, 
        metadata, 
        is_active,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, email, full_name, role, organization, created_at
    `;
    
    const values = [
      email.toLowerCase(),
      hashedPassword,
      full_name,
      role,
      organization || null,
      source || 'auth_signup',
      new Date(),
      {
        signup_source: source || 'auth_signup',
        signup_date: new Date().toISOString(),
        is_authenticated: true
      },
      true
    ];
    
    const insertResult = await client.query(insertUserQuery, values);
    const user = insertResult.rows[0];
    
    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'garnet-ai-super-secret-jwt-key-2025-production';
    
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('User created successfully via auth signup');
    
    return res.status(201).json({
      message: 'Successfully signed up!',
      token,
      user
    });
    
  } catch (error) {
    console.error('Auth signup error:', error);
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Authentication login endpoint
app.post('/api/auth/login', async (req, res) => {
  console.log('Received auth login request at:', new Date().toISOString());
  console.log('Request body:', req.body);
  
  const client = await pool.connect();
  
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Find user by email
    const userQuery = 'SELECT id, email, password_hash, full_name, role, organization, created_at FROM users WHERE email = $1';
    const userResult = await client.query(userQuery, [email.toLowerCase()]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = userResult.rows[0];
    
    // Check if password exists (user might be from waitlist without password)
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Account not set up for login. Please sign up again.' });
    }
    
    // Verify password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'garnet-ai-super-secret-jwt-key-2025-production';
    
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('User logged in successfully via auth login');
    
    return res.status(200).json({
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
    });
    
  } catch (error) {
    console.error('Auth login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// API Endpoint to join waitlist
app.post('/join-waitlist', async (req, res) => {
  console.log('Received waitlist request at:', new Date().toISOString());
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  
  // Handle empty request
  if (!req.body || Object.keys(req.body).length === 0) {
    console.error('Empty request body received');
    return res.status(400).json({ error: 'No request body provided' });
  }

  const client = await pool.connect();
  
  try {
    const { email, full_name, role, organization } = req.body;
    
    // Validate required fields
    if (!email || !full_name) {
      console.error('Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields: email and full_name are required' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Invalid email format:', email);
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    console.log('Inserting into waitlist table...');
    
    // Insert into waitlist table
    const insertQuery = `
      INSERT INTO waitlist (name, email, role, organization)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    
    const values = [
      full_name,
      email.toLowerCase(),
      role || null,
      organization || null
    ];
    
    console.log('Executing SQL:', insertQuery);
    console.log('With values:', values);
    
    const result = await client.query(insertQuery, values);
    
    console.log('Successfully added to waitlist. Rows returned:', result.rowCount);
    console.log('Inserted data:', result.rows[0]);
    
    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Successfully joined the waitlist!',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error in join-waitlist endpoint:', error);
    
    // Check for duplicate email
    if (error.code === '23505') {
      return res.status(409).json({ 
        success: false,
        error: 'Email already registered in waitlist'
      });
    }
    
    // General error
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  } finally {
    client.release();
    console.log('Database connection released');
    console.log('==================================================');
  }
});

// Get waitlist stats
app.get('/api/waitlist/stats', async (req, res) => {
  const client = await pool.connect();
  
  try {
    // Get total count
    const totalQuery = 'SELECT COUNT(*) as total FROM waitlist';
    const totalResult = await client.query(totalQuery);
    
    // Get count by role
    const roleQuery = `
      SELECT role, COUNT(*) as count 
      FROM waitlist 
      WHERE role IS NOT NULL
      GROUP BY role 
      ORDER BY count DESC
    `;
    const roleResult = await client.query(roleQuery);
    
    const byRole = {};
    roleResult.rows.forEach(row => {
      byRole[row.role] = parseInt(row.count);
    });
    
    res.json({
      total: parseInt(totalResult.rows[0].total),
      byRole
    });
  } catch (error) {
    console.error('Error fetching waitlist stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get all waitlist entries
app.get('/api/waitlist/users', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT * FROM waitlist 
      ORDER BY created_at DESC
    `;
    const result = await client.query(query);
    
    res.json({ entries: result.rows });
  } catch (error) {
    console.error('Error fetching waitlist entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Waitlist and Authentication API is running',
    version: '2.1.0',
    endpoints: [
      {
        path: '/join-waitlist',
        method: 'POST',
        description: 'Add a user to the waitlist'
      },
      {
        path: '/api/auth/signup',
        method: 'POST',
        description: 'User signup with authentication'
      },
      {
        path: '/api/auth/login',
        method: 'POST',
        description: 'User login with authentication'
      },
      {
        path: '/api/waitlist/stats',
        method: 'GET',
        description: 'Get waitlist statistics'
      },
      {
        path: '/api/waitlist/users',
        method: 'GET',
        description: 'Get all waitlist entries'
      }
    ]
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Waitlist API is available at: http://localhost:${PORT}/join-waitlist`);
  console.log('For production: https://garnet-compliance-saas-production.up.railway.app/join-waitlist');
  console.log('Netlify site: https://testinggarnet.netlify.app/');
});

// Sample curl command to test the endpoint:
/*
curl -X POST https://garnet-compliance-saas-production.up.railway.app/join-waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "full_name": "Test User",
    "password": "password123",
    "role": "Developer",
    "organization": "Test Company"
  }'
*/

// To deploy to Railway:
// 1. Push this code to a GitHub repository
// 2. Sign up for Railway (railway.app)
// 3. Create a new project and link your GitHub repository
// 4. Add a PostgreSQL database service to your project
// 5. Set up environment variables:
//    - DATABASE_URL (will be automatically linked to your PostgreSQL instance)
//    - PORT (optional, Railway sets this automatically)
// 6. Deploy your application 