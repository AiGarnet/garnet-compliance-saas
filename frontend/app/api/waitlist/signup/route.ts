import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Fallback database URL if environment variable is not set
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:Sonasuhani1@localhost:5432/garnet_ai';

// Initialize PostgreSQL connection pool for local development
const createPool = () => {
  console.log('Attempting to connect to PostgreSQL with:', DATABASE_URL.replace(/\/\/(.+?):(.+?)@/, '//***:***@'));
  
  try {
    const pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    // Test connection
    pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.error('PostgreSQL connection test failed:', err.message);
      } else {
        console.log('PostgreSQL connection successful:', res.rows[0]);
      }
    });
    
    return pool;
  } catch (error) {
    console.error('Error creating PostgreSQL pool:', error);
    return null;
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get the environment
    const isNetlify = process.env.NETLIFY === 'true';
    const isDev = process.env.NODE_ENV !== 'production'; // Default to development if not set
    
    console.log('Environment:', { isNetlify, isDev, DATABASE_URL: !!DATABASE_URL });
    
    let response;
    
    if (isNetlify) {
      // When deployed on Netlify, the function is already available through /.netlify/functions/
      response = await fetch('/.netlify/functions/waitlist-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else if (isDev) {
      // For local development, try to use PostgreSQL directly
      try {
        console.log('Attempting to use PostgreSQL for waitlist signup');
        const pool = createPool();
        
        // If no database connection available, fall back to file-based storage
        if (!pool) {
          console.log('No PostgreSQL pool available, falling back to JSON file storage');
          return await storeUserInJsonFile(body);
        }
        
        const client = await pool.connect();
        console.log('PostgreSQL client connected successfully');
        
        try {
          // Check if email already exists
          const checkQuery = 'SELECT id FROM users WHERE email = $1';
          const checkResult = await client.query(checkQuery, [body.email.toLowerCase()]);
          
          if (checkResult.rows.length > 0) {
            console.log('Email already exists in PostgreSQL');
            return NextResponse.json(
              { error: 'Email already registered' },
              { status: 409 }
            );
          }
          
          // Hash the password
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(body.password, saltRounds);
          
          // Generate UUID for user id
          const userId = uuidv4();
          
          // Insert user into database
          const insertQuery = `
            INSERT INTO users (
              id, email, password_hash, full_name, role, organization, 
              is_active, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
            RETURNING id, email, full_name, role, organization, created_at, updated_at
          `;
          
          const values = [
            userId,
            body.email.toLowerCase(),
            hashedPassword,
            body.full_name,
            body.role,
            body.organization || null,
            true, // is_active
            new Date() // Both created_at and updated_at
          ];
          
          console.log('Executing PostgreSQL insert query');
          const result = await client.query(insertQuery, values);
          const newUser = result.rows[0];
          console.log('User successfully inserted into PostgreSQL:', newUser.id);
          
          return NextResponse.json({
            message: 'Successfully joined the waitlist!',
            user: newUser,
            storage: 'postgresql'
          }, { status: 201 });
        } catch (dbError: any) {
          console.error('Database error:', dbError);
          // Check for duplicate email (unique constraint violation)
          if (dbError.code === '23505') {
            return NextResponse.json(
              { error: 'Email already registered' },
              { status: 409 }
            );
          }
          
          // If database operations fail, fall back to file storage
          console.log('PostgreSQL operation failed, falling back to JSON file storage');
          return await storeUserInJsonFile(body);
        } finally {
          client.release();
        }
      } catch (dbConnectionError) {
        console.error('Database connection error:', dbConnectionError);
        // Fall back to file storage if database connection fails
        console.log('PostgreSQL connection failed, falling back to JSON file storage');
        return await storeUserInJsonFile(body);
      }
    } else {
      // Fall back to backend server if not on Netlify or local dev
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      response = await fetch(`${backendUrl}/api/waitlist/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Fallback function to store user in a JSON file when database is not available
async function storeUserInJsonFile(userData: any) {
  try {
    console.log('Storing user in JSON file instead of PostgreSQL');
    const fs = require('fs');
    const path = require('path');
    
    // Define path for users.json in public folder
    const dataFilePath = path.join(process.cwd(), 'public', 'users.json');
    
    // Read existing users or create empty array
    let users = [];
    try {
      if (fs.existsSync(dataFilePath)) {
        const fileContent = fs.readFileSync(dataFilePath, 'utf8');
        users = JSON.parse(fileContent);
      }
    } catch (error) {
      console.error('Error reading users file:', error);
    }
    
    // Check if email already exists
    const emailExists = users.some((user: any) => user.email === userData.email);
    if (emailExists) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }
    
    // Create new user
    const newUser = {
      id: uuidv4(),
      email: userData.email,
      full_name: userData.full_name,
      role: userData.role,
      organization: userData.organization || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Don't store actual password in JSON
      password_hash: '********'
    };
    
    // Add to users array
    users.push(newUser);
    
    // Create directory if it doesn't exist
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write to file
    fs.writeFileSync(dataFilePath, JSON.stringify(users, null, 2), 'utf8');
    console.log('User successfully stored in JSON file:', newUser.id);
    
    return NextResponse.json({
      message: 'Successfully joined the waitlist!',
      user: { ...newUser, password_hash: undefined },
      storage: 'json_file'
    }, { status: 201 });
  } catch (fileError) {
    console.error('File operation error:', fileError);
    return NextResponse.json(
      { error: 'Failed to save user data' },
      { status: 500 }
    );
  }
} 