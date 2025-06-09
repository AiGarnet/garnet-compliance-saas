const { Pool } = require('pg');

// Railway database configuration
const pool = new Pool({
  host: 'shortline.proxy.rlwy.net',
  port: 28381,
  database: 'railway',
  user: 'postgres',
  password: 'FaHfoxEmIwaAJuzOmQTOfStkainUxzzX',
  ssl: { rejectUnauthorized: false }
});

async function testRailwayDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Testing Railway PostgreSQL connection...');
    
    // Test basic connection
    const versionQuery = 'SELECT version()';
    const versionResult = await client.query(versionQuery);
    console.log('✅ Database connected successfully');
    console.log('Database version:', versionResult.rows[0].version.split(' ')[0]);
    
    // Check if users table exists
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `;
    
    const tableExistsResult = await client.query(tableExistsQuery);
    const tableExists = tableExistsResult.rows[0].exists;
    
    if (tableExists) {
      console.log('✅ Users table exists');
      
      // Check users table structure
      const structureQuery = `
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `;
      const structureResult = await client.query(structureQuery);
      console.log('\n📋 Users table structure:');
      structureResult.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}) ${row.column_default ? `default: ${row.column_default}` : ''}`);
      });
      
      // Check how many users are in the table
      const countQuery = 'SELECT COUNT(*) as count FROM users';
      const countResult = await client.query(countQuery);
      console.log(`\n👥 Total users in table: ${countResult.rows[0].count}`);
      
      // Show sample users (if any)
      if (parseInt(countResult.rows[0].count) > 0) {
        const usersQuery = 'SELECT id, email, full_name, role, organization, created_at FROM users ORDER BY created_at DESC LIMIT 5';
        const usersResult = await client.query(usersQuery);
        console.log('\n📊 Sample users (last 5):');
        usersResult.rows.forEach(user => {
          console.log(`  • ${user.email} - ${user.full_name} (${user.role}) - ${new Date(user.created_at).toLocaleDateString()}`);
        });
      }
    } else {
      console.log('❌ Users table does not exist');
      console.log('Creating users table...');
      
      // Create users table
      const createTableQuery = `
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          role VARCHAR(100) NOT NULL CHECK (role IN ('vendor', 'enterprise')),
          organization VARCHAR(255),
          metadata JSONB DEFAULT '{}'::jsonb,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create indexes for better performance
        CREATE INDEX users_email_idx ON users(email);
        CREATE INDEX users_role_idx ON users(role);
        CREATE INDEX users_created_at_idx ON users(created_at);
      `;
      
      await client.query(createTableQuery);
      console.log('✅ Users table created successfully!');
    }
    
  } catch (error) {
    console.error('❌ Database test error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test
testRailwayDatabase()
  .then(() => {
    console.log('\n✅ Database test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Database test failed:', error);
    process.exit(1);
  }); 