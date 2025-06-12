const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testEvidenceAPI() {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to database successfully');

    // Test 1: Check if we have any vendors to test with
    const vendorsQuery = 'SELECT vendor_id, company_name FROM vendors LIMIT 3;';
    const vendors = await client.query(vendorsQuery);
    
    console.log('\nAvailable vendors for testing:');
    vendors.rows.forEach(vendor => {
      console.log(`- ID: ${vendor.vendor_id}, Name: ${vendor.company_name}`);
    });

    if (vendors.rows.length === 0) {
      console.log('No vendors found. Creating a test vendor...');
      
      const insertVendorQuery = `
        INSERT INTO vendors (company_name, region, contact_email, status, risk_score, risk_level)
        VALUES ('Test Evidence Vendor', 'US', 'test@evidencevendor.com', 'Pending', 50, 'Medium')
        RETURNING vendor_id, company_name;
      `;
      
      const newVendor = await client.query(insertVendorQuery);
      console.log(`Created test vendor: ID ${newVendor.rows[0].vendor_id}, Name: ${newVendor.rows[0].company_name}`);
    }

    // Test 2: Check evidence files table structure
    const evidenceCountQuery = 'SELECT COUNT(*) as count FROM evidence_files;';
    const evidenceCount = await client.query(evidenceCountQuery);
    console.log(`\nCurrent evidence files in database: ${evidenceCount.rows[0].count}`);

    // Test 3: Check if all required columns exist
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'evidence_files'
      AND column_name IN ('vendor_id', 'answer_id', 'filename', 'file_path', 'mime_type')
      ORDER BY column_name;
    `;
    
    const columns = await client.query(columnsQuery);
    console.log('\nRequired evidence_files columns:');
    columns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    console.log('\n✅ Evidence API backend setup verification completed!');
    console.log('\nAPI Endpoints that should be available:');
    console.log('POST   /api/vendors/:vendorId/evidence - Upload evidence file');
    console.log('GET    /api/vendors/:vendorId/evidence - Get vendor evidence files');
    console.log('GET    /api/vendors/:vendorId/evidence/count - Get evidence count');
    console.log('GET    /api/vendors/:vendorId/evidence/:evidenceId/download - Download evidence');
    console.log('DELETE /api/vendors/:vendorId/evidence/:evidenceId - Delete evidence');
    console.log('GET    /api/answers/:answerId/evidence - Get answer evidence files');

  } catch (error) {
    console.error('Error testing evidence API:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

testEvidenceAPI(); 