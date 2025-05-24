// Load environment variables
require('dotenv').config({ path: './.env.local' });
const { Pool } = require('pg');

// Fallback database URL if environment variable is not set
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:Sonasuhani1@localhost:5432/garnet_ai';

async function setupDatabase() {
  console.log('Setting up database...');
  
  console.log('Using database URL:', DATABASE_URL.replace(/\/\/(.+?):(.+?)@/, '//***:***@'));
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: false
  });
  
  try {
    // Test connection
    const connectionTest = await pool.query('SELECT NOW()');
    console.log('PostgreSQL connection successful:', connectionTest.rows[0].now);
    
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    console.log('Users table exists:', tableExists);
    
    if (!tableExists) {
      console.log('Creating users table...');
      await pool.query(`
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
      console.log('Users table created successfully');
    } else {
      // Show table structure
      const tableStructure = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `);
      
      console.log('Users table structure:');
      tableStructure.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
      
      // Count users
      const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
      console.log(`Total users in table: ${userCount.rows[0].count}`);
    }
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase(); 