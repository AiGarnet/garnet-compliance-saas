const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'garnet_ai',
  user: 'postgres',
  password: 'Sonasuhani1',
});

async function testDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Testing database connection...');
    
    // Check if users table exists
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `;
    const tablesResult = await client.query(tablesQuery);
    console.log('Users table exists:', tablesResult.rows.length > 0);
    
    if (tablesResult.rows.length > 0) {
      // Check users table structure
      const structureQuery = `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `;
      const structureResult = await client.query(structureQuery);
      console.log('Users table structure:');
      structureResult.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
      
      // Check how many users are in the table
      const countQuery = 'SELECT COUNT(*) as count FROM users';
      const countResult = await client.query(countQuery);
      console.log(`Total users in table: ${countResult.rows[0].count}`);
      
      // Show all users
      const usersQuery = 'SELECT id, email, full_name, role, organization, created_at FROM users ORDER BY created_at DESC';
      const usersResult = await client.query(usersQuery);
      console.log('Users in table:');
      usersResult.rows.forEach(user => {
        console.log(`  ${user.email} - ${user.full_name} (${user.role}) - ${user.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('Database test error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testDatabase(); 