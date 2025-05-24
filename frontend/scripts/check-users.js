/**
 * Script to check for users in the database
 * Run with: node scripts/check-users.js
 */

const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'garnet_ai',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Sonasuhani1',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkUsers() {
  const client = await pool.connect();
  try {
    console.log('Checking for users in the database...');
    
    // Query users table
    const result = await client.query('SELECT id, email, full_name, role, organization, created_at FROM users');
    
    if (result.rows.length === 0) {
      console.log('No users found in the database.');
    } else {
      console.log(`Found ${result.rows.length} users:`);
      result.rows.forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`);
        console.log(`- ID: ${user.id}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- Name: ${user.full_name}`);
        console.log(`- Role: ${user.role}`);
        console.log(`- Organization: ${user.organization || 'N/A'}`);
        console.log(`- Created: ${new Date(user.created_at).toLocaleString()}`);
      });
    }
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the check
checkUsers().catch(console.error); 