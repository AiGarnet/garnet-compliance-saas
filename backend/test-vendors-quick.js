const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: { rejectUnauthorized: false }
});

async function testVendors() {
  const client = await pool.connect();
  
  try {
    console.log('Testing vendors...');
    
    // Check if there are any vendors
    const vendors = await client.query('SELECT * FROM vendors LIMIT 5');
    console.log(`Found ${vendors.rows.length} vendors in database`);
    
    if (vendors.rows.length > 0) {
      console.log('Sample vendor:', JSON.stringify(vendors.rows[0], null, 2));
    } else {
      console.log('No vendors found. Creating a test vendor...');
      
      // Create a test vendor
      const result = await client.query(`
        INSERT INTO vendors (
          company_name, region, contact_email, status, 
          risk_score, risk_level, contact_name, website, 
          industry, description
        ) VALUES (
          'Test Company', 'US', 'test@example.com', 'Questionnaire Pending',
          50, 'Medium', 'John Doe', 'https://example.com',
          'Technology', 'A test company for verification'
        ) RETURNING *
      `);
      
      console.log('Created test vendor:', JSON.stringify(result.rows[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testVendors(); 