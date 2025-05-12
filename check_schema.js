const { Pool } = require('pg');

// Configure PostgreSQL connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'garnet_ai',
  user: 'postgres',
  password: 'Sonasuhani1'
});

async function checkSchema() {
  const client = await pool.connect();
  
  try {
    console.log('Checking existing tables in the database:');
    
    // Get all tables in the database
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' 
      AND table_type='BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('\nExisting tables:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Check compliance_frameworks structure
    console.log('\nChecking compliance_frameworks table structure:');
    const frameworksColumnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'compliance_frameworks'
      ORDER BY ordinal_position;
    `);
    
    frameworksColumnsResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });
    
    // Count frameworks
    const frameworksCountResult = await client.query('SELECT COUNT(*) FROM compliance_frameworks');
    console.log(`\nTotal compliance frameworks: ${frameworksCountResult.rows[0].count}`);
    
  } catch (error) {
    console.error('Error checking schema:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema(); 