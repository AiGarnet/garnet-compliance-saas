const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkVendorsTable() {
  try {
    console.log('🔍 Checking vendors table in the database...\n');
    
    // Check if vendors table exists
    console.log('1️⃣ Checking if vendors table exists...');
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'vendors'
      );
    `);
    console.log(`✅ Vendors table exists: ${tableExists.rows[0].exists}`);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ Vendors table does not exist!');
      return;
    }
    
    // Check table structure
    console.log('\n2️⃣ Checking vendors table structure...');
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'vendors'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Table structure:');
    structure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Count total vendors
    console.log('\n3️⃣ Counting vendors...');
    const count = await pool.query('SELECT COUNT(*) FROM vendors');
    console.log(`📊 Total vendors: ${count.rows[0].count}`);
    
    // Get sample vendors
    if (parseInt(count.rows[0].count) > 0) {
      console.log('\n4️⃣ Sample vendors:');
      const vendors = await pool.query('SELECT * FROM vendors LIMIT 5');
      vendors.rows.forEach((vendor, index) => {
        console.log(`\n   Vendor ${index + 1}:`);
        console.log(`   - ID: ${vendor.vendor_id || vendor.id}`);
        console.log(`   - UUID: ${vendor.uuid}`);
        console.log(`   - Company Name: ${vendor.company_name || vendor.name}`);
        console.log(`   - Contact Email: ${vendor.contact_email}`);
        console.log(`   - Status: ${vendor.status}`);
        console.log(`   - Created: ${vendor.created_at}`);
      });
    } else {
      console.log('\n⚠️  No vendors found in the database!');
      console.log('   You need to add some vendors first.');
    }
    
    // Test the backend API endpoint
    console.log('\n5️⃣ Testing backend API endpoint...');
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch('https://shortline.proxy.rlwy.net:28381/api/vendors');
      console.log(`   API Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   API returned ${Array.isArray(data) ? data.length : 'non-array'} vendors`);
        if (Array.isArray(data) && data.length > 0) {
          console.log(`   First vendor from API: ${JSON.stringify(data[0], null, 2)}`);
        }
      } else {
        const errorText = await response.text();
        console.log(`   API Error: ${errorText}`);
      }
    } catch (apiError) {
      console.log(`   API Error: ${apiError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking vendors table:', error);
  } finally {
    await pool.end();
  }
}

checkVendorsTable(); 