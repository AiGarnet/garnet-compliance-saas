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
    'http://localhost:3000', 
    'https://garnetai.netlify.app',
    'https://garnet-compliance-saas-production.up.railway.app',
    'https://testinggarnet.netlify.app'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

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
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_waitlist_email ON waitlist(email);
      `);
      console.log('Waitlist table created successfully!');
    }
  } catch (error) {
    console.error('Database setup error:', error);
  } finally {
    client.release();
  }
}

// API Endpoint to join waitlist
app.post('/join-waitlist', async (req, res) => {
  console.log('Received waitlist request:', req.body);
  
  if (!req.body) {
    return res.status(400).json({ error: 'No request body provided' });
  }

  // Get the first client request to check/create fields dynamically
  const client = await pool.connect();
  
  try {
    // First check if waitlist table exists, if not create it
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'waitlist'
      );
    `);
    
    const tableExists = tableCheckResult.rows[0].exists;
    
    if (!tableExists) {
      console.log('Creating waitlist table dynamically based on the request...');
      
      // Get all fields from the request body to create columns
      const fields = Object.keys(req.body);
      
      // Generate column definitions from the fields
      // Always include id, email and created_at as required fields
      let columnDefinitions = [
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
        'email TEXT UNIQUE NOT NULL',
        'created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP'
      ];
      
      // Add other fields from the request
      fields.forEach(field => {
        if (field !== 'email') { // Skip email as we already added it
          // For simplicity, all fields are stored as TEXT
          columnDefinitions.push(`${field} TEXT`);
        }
      });
      
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
      const requestFields = Object.keys(req.body);
      
      // Find missing columns
      const missingColumns = requestFields.filter(
        field => !existingColumns.includes(field) && field !== 'id' && field !== 'created_at'
      );
      
      // Add any missing columns
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
    
    // Verify email is provided
    if (!req.body.email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Prepare fields and values for insertion
    const fields = Object.keys(req.body);
    const values = Object.values(req.body);
    
    // Create placeholders for the query
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
    
    // Construct the query
    const insertQuery = `
      INSERT INTO waitlist (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *;
    `;
    
    // Execute the query
    const result = await client.query(insertQuery, values);
    
    console.log('Successfully added to waitlist:', result.rows[0]);
    
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
    "name": "Test User",
    "company": "Test Company",
    "role": "Developer",
    "interests": "AI, Compliance"
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