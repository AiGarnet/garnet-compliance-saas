require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

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
    'https://testinggarnet.netlify.app'
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
  next();
});

// Check database connection and create table if it doesn't exist
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
      console.log('Creating waitlist table as it does not exist...');
      await client.query(`
        CREATE TABLE waitlist (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          full_name TEXT NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL,
          organization TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_waitlist_email ON waitlist(email);
      `);
      console.log('Waitlist table created successfully!');
    }

    // Check the table structure to ensure it has the required fields
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
  console.log('==================================================');
  console.log('Received waitlist request at:', new Date().toISOString());
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  
  // Handle empty request
  if (!req.body || Object.keys(req.body).length === 0) {
    console.error('Empty request body received');
    return res.status(400).json({ error: 'No request body provided' });
  }

  // Get the first client request to check/create fields dynamically
  const client = await pool.connect();
  
  try {
    // First check if waitlist table exists
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'waitlist'
      );
    `);
    
    const tableExists = tableCheckResult.rows[0].exists;
    console.log('Waitlist table exists:', tableExists);
    
    if (!tableExists) {
      console.log('Creating waitlist table dynamically based on the request...');
      
      // Get all fields from the request body to create columns
      const fields = Object.keys(req.body);
      console.log('Fields from request:', fields);
      
      // Generate column definitions from the fields
      // Always include id, email and created_at as required fields
      let columnDefinitions = [
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
        'email TEXT UNIQUE NOT NULL',
        'full_name TEXT NOT NULL',
        'password TEXT NOT NULL',
        'role TEXT NOT NULL',
        'organization TEXT',
        'created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP'
      ];
      
      // Create the table
      await client.query(`
        CREATE TABLE waitlist (
          ${columnDefinitions.join(',\n          ')}
        );
        
        CREATE INDEX idx_waitlist_email ON waitlist(email);
      `);
      
      console.log('Waitlist table created with columns:', columnDefinitions);
    } else {
      // If table exists, check if all fields in the request exist as columns
      console.log('Checking if all fields exist in waitlist table...');
      
      const columnQuery = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'waitlist';
      `);
      
      const existingColumns = columnQuery.rows.map(row => row.column_name);
      console.log('Existing columns:', existingColumns);
      
      const requestFields = Object.keys(req.body);
      console.log('Request fields:', requestFields);
      
      // Find missing columns
      const missingColumns = requestFields.filter(
        field => !existingColumns.includes(field) && field !== 'id' && field !== 'created_at'
      );
      
      if (missingColumns.length > 0) {
        console.log('Adding missing columns to waitlist table:', missingColumns);
        
        for (const column of missingColumns) {
          await client.query(`
            ALTER TABLE waitlist
            ADD COLUMN ${column} TEXT;
          `);
        }
        
        console.log('Added new columns successfully');
      }
    }
    
    // Map form field names if they don't match table column names
    const formData = { ...req.body };
    
    // Check if we have expected fields, otherwise try to map them
    if (!formData.full_name && formData.name) {
      formData.full_name = formData.name;
      delete formData.name;
    }

    if (!formData.organization && formData.company) {
      formData.organization = formData.company;
      delete formData.company;
    }
    
    // Log the processed data
    console.log('Processed form data for insertion:', formData);
    
    // Verify email is provided
    if (!formData.email) {
      console.error('Email is missing in the request');
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      console.error('Invalid email format:', formData.email);
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Verify other required fields
    if (!formData.full_name) {
      console.error('Full name is missing in the request');
      return res.status(400).json({ error: 'Full name is required' });
    }
    
    if (!formData.password) {
      console.error('Password is missing in the request');
      return res.status(400).json({ error: 'Password is required' });
    }
    
    if (!formData.role) {
      console.error('Role is missing in the request');
      return res.status(400).json({ error: 'Role is required' });
    }
    
    // Prepare fields and values for insertion
    const fields = Object.keys(formData);
    const values = Object.values(formData);
    
    // Create placeholders for the query
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
    
    // Construct the query
    const insertQuery = `
      INSERT INTO waitlist (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *;
    `;
    
    console.log('Executing SQL:', insertQuery);
    console.log('With values:', values);
    
    // Execute the query
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
    if (error.code === '23505' && error.constraint === 'waitlist_email_key') {
      return res.status(409).json({ 
        error: 'Email already registered on the waitlist'
      });
    }
    
    // General error
    return res.status(500).json({ 
      error: 'Error processing waitlist registration',
      details: error.message
    });
  } finally {
    client.release();
    console.log('Database connection released');
    console.log('==================================================');
  }
});

// Add a simple health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Waitlist API is running',
    version: '1.0.0',
    endpoints: [
      {
        path: '/join-waitlist',
        method: 'POST',
        description: 'Add a user to the waitlist'
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