const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway'
});

async function checkDatabase() {
  try {
    await client.connect();
    console.log('✅ Database connection successful');
    
    // Check if vendors table exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'vendors'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ Vendors table exists');
      
      // Check table structure
      const columnsQuery = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'vendors'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 Vendors table structure:');
      columnsQuery.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
      // Check vendor count
      const countResult = await client.query('SELECT COUNT(*) as count FROM vendors');
      console.log(`\n📊 Total vendors in database: ${countResult.rows[0].count}`);
      
      // Show sample vendors
      if (countResult.rows[0].count > 0) {
        const sampleResult = await client.query(`
          SELECT vendor_id, uuid, company_name, status, created_at 
          FROM vendors 
          LIMIT 5
        `);
        
        console.log('\n📝 Sample vendors:');
        sampleResult.rows.forEach(vendor => {
          console.log(`  - ID: ${vendor.vendor_id}, UUID: ${vendor.uuid}, Name: ${vendor.company_name}, Status: ${vendor.status}`);
        });
      }
    } else {
      console.log('❌ Vendors table does not exist');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

checkDatabase(); 