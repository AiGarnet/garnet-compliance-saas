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

// Check database connection and ensure proper table structure
async function setupDatabase() {
  const client = await pool.connect();
  try {
    console.log('Checking database connection...');
    
    // Check if waitlist table exists
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'waitlist'
      );
    `);
    
    const tableExists = tableCheckResult.rows[0].exists;
    console.log('Waitlist table exists:', tableExists);
    
    if (!tableExists) {
      console.log('Creating waitlist table...');
      await client.query(`
        CREATE TABLE waitlist (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          role VARCHAR(100),
          organization VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX waitlist_email_idx ON waitlist(email);
        CREATE INDEX waitlist_created_at_idx ON waitlist(created_at);
        CREATE INDEX waitlist_role_idx ON waitlist(role);
      `);
      console.log('Waitlist table created successfully!');
    }

    // Check the table structure
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'waitlist'
      ORDER BY ordinal_position;
    `);
    
    console.log('Waitlist table structure:');
    console.table(columnsResult.rows);
  } catch (error) {
    console.error('Database setup error:', error);
  } finally {
    client.release();
  }
}

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
    message: 'Waitlist API is running',
    version: '2.0.0',
    endpoints: [
      {
        path: '/join-waitlist',
        method: 'POST',
        description: 'Add a user to the waitlist'
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
app.listen(PORT, async () => {
  try {
    await setupDatabase();
    console.log(`Server running on port ${PORT}`);
    console.log(`Waitlist API is available at: http://localhost:${PORT}/join-waitlist`);
    console.log('For production: https://garnet-compliance-saas-production.up.railway.app/join-waitlist');
    console.log('Netlify site: https://testinggarnet.netlify.app/');
  } catch (error) {
    console.error('Failed to setup database on startup:', error);
  }
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