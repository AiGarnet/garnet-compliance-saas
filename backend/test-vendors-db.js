const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: { rejectUnauthorized: false }
});

async function testDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Testing database connection...');
    
    // Test connection
    const result = await client.query('SELECT NOW()');
    console.log('Database connected successfully at:', result.rows[0].now);
    
    // Check existing tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\nExisting tables:');
    tables.rows.forEach(row => {
      console.log('- ' + row.table_name);
    });
    
    // Check if vendors table exists
    const vendorsTable = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'vendors'
      ORDER BY ordinal_position;
    `);
    
    if (vendorsTable.rows.length > 0) {
      console.log('\nVendors table structure:');
      vendorsTable.rows.forEach(row => {
        console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    } else {
      console.log('\nVendors table does not exist.');
    }
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testDatabase(); 