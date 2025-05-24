import { Pool } from 'pg';
import { DB_CONFIG } from './env';

// Create a database connection pool
const pool = new Pool(DB_CONFIG);

// Helper function to execute database queries
export async function executeQuery(text: string, params: any[] = []) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

// Initialize the database with required tables
export async function initDb() {
  try {
    // Check if users table exists, if not create it
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS users (
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
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// User-related database operations
export const userDb = {
  // Create a new user
  async createUser(userData: {
    id: string;
    email: string;
    password_hash: string;
    full_name: string;
    role: string;
    organization: string | null;
  }) {
    const { id, email, password_hash, full_name, role, organization } = userData;
    
    const result = await executeQuery(
      `INSERT INTO users (id, email, password_hash, full_name, role, organization)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, full_name, role, organization, created_at, updated_at`,
      [id, email.toLowerCase(), password_hash, full_name, role, organization]
    );
    
    return result.rows[0];
  },
  
  // Find a user by email
  async findUserByEmail(email: string) {
    const result = await executeQuery(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    return result.rows[0] || null;
  },
  
  // Find a user by ID
  async findUserById(id: string) {
    const result = await executeQuery(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  }
};

// Initialize the database when this module is imported
if (process.env.NODE_ENV !== 'test') {
  initDb().catch(console.error);
}

export default pool; 