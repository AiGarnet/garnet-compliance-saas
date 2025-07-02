const { Client } = require('pg');

async function checkDatabaseStructure() {
  const client = new Client({
    connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway'
  });

  try {
    await client.connect();
    
    console.log('=== VENDORS TABLE STRUCTURE ===');
    const vendorsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'vendors' 
      ORDER BY ordinal_position;
    `);
    console.table(vendorsColumns.rows);
    
    console.log('\n=== USERS TABLE STRUCTURE ===');
    const usersColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    console.table(usersColumns.rows);
    
    console.log('\n=== ORGANIZATIONS TABLE STRUCTURE ===');
    const orgsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'organizations' 
      ORDER BY ordinal_position;
    `);
    console.table(orgsColumns.rows);
    
    console.log('\n=== SAMPLE VENDORS DATA ===');
    const vendors = await client.query('SELECT vendor_id, uuid, company_name, status FROM vendors LIMIT 3;');
    console.table(vendors.rows);
    
    console.log('\n=== SAMPLE USERS DATA ===');
    const users = await client.query('SELECT id, email, role, organization_id FROM users LIMIT 3;');
    console.table(users.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkDatabaseStructure(); 