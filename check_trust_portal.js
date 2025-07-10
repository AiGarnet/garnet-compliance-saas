const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkTrustPortalData() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Check trust portal items
    console.log('\n=== TRUST PORTAL ITEMS ===');
    const trustPortalItems = await client.query(`
      SELECT id, vendor_id, title, description, category, is_questionnaire_answer, questionnaire_id, created_at 
      FROM trust_portal_items 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    console.log(`Found ${trustPortalItems.rows.length} trust portal items:`);
    trustPortalItems.rows.forEach((item, index) => {
      console.log(`${index + 1}. ID: ${item.id}, Vendor: ${item.vendor_id}, Title: ${item.title}, Created: ${item.created_at}`);
    });

    // Check vendors table
    console.log('\n=== VENDORS ===');
    const vendors = await client.query(`
      SELECT vendor_id, uuid, company_name, created_at 
      FROM vendors 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log(`Found ${vendors.rows.length} vendors:`);
    vendors.rows.forEach((vendor, index) => {
      console.log(`${index + 1}. ID: ${vendor.vendor_id}, UUID: ${vendor.uuid}, Name: ${vendor.company_name}`);
    });

    // Check specific vendor
    console.log('\n=== SPECIFIC VENDOR ===');
    const specificVendor = await client.query(`
      SELECT vendor_id, uuid, company_name 
      FROM vendors 
      WHERE uuid = 'f18eec97-86e9-44c4-80b7-c86461f3efbe'
    `);
    if (specificVendor.rows.length > 0) {
      console.log('Found vendor:', specificVendor.rows[0]);
      
      // Check trust portal items for this vendor
      const vendorItems = await client.query(`
        SELECT id, title, description, category, created_at 
        FROM trust_portal_items 
        WHERE vendor_id = $1 
        ORDER BY created_at DESC
      `, [specificVendor.rows[0].vendor_id]);
      console.log(`Trust portal items for this vendor: ${vendorItems.rows.length}`);
      vendorItems.rows.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title} (${item.category}) - ${item.created_at}`);
      });
    } else {
      console.log('Vendor not found!');
    }

    // Check supporting documents
    console.log('\n=== SUPPORTING DOCUMENTS ===');
    const supportingDocs = await client.query(`
      SELECT id, vendor_id, filename, file_type, uploaded_at 
      FROM checklist_supporting_documents 
      ORDER BY uploaded_at DESC 
      LIMIT 5
    `);
    console.log(`Found ${supportingDocs.rows.length} supporting documents:`);
    supportingDocs.rows.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.filename} for vendor ${doc.vendor_id} - ${doc.uploaded_at}`);
    });

  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await client.end();
  }
}

checkTrustPortalData(); 