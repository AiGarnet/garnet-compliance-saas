const { exec } = require('child_process');

// Simple database query function using psql
function queryDatabase(sql) {
  return new Promise((resolve, reject) => {
    const command = `psql "postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway" -c "${sql}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

async function debugTrustPortal() {
  try {
    console.log('🔍 DEBUGGING TRUST PORTAL ISSUES...\n');

    // Check if the specific vendor exists
    console.log('1. Checking if vendor f18eec97-86e9-44c4-80b7-c86461f3efbe exists:');
    const vendorCheck = await queryDatabase("SELECT vendor_id, uuid, company_name FROM vendors WHERE uuid = 'f18eec97-86e9-44c4-80b7-c86461f3efbe';");
    console.log(vendorCheck);

    // Check trust portal items table
    console.log('2. Checking trust portal items:');
    const trustPortalItems = await queryDatabase("SELECT id, vendor_id, title, category, created_at FROM trust_portal_items ORDER BY created_at DESC LIMIT 5;");
    console.log(trustPortalItems);

    // Check supporting documents
    console.log('3. Checking supporting documents:');
    const supportingDocs = await queryDatabase("SELECT id, vendor_id, filename, uploaded_at FROM checklist_supporting_documents ORDER BY uploaded_at DESC LIMIT 5;");
    console.log(supportingDocs);

    // Check if any trust portal items exist for our vendor
    console.log('4. Checking trust portal items for specific vendor:');
    const vendorItems = await queryDatabase(`
      SELECT tp.id, tp.title, tp.category, tp.created_at 
      FROM trust_portal_items tp 
      JOIN vendors v ON tp.vendor_id = v.vendor_id 
      WHERE v.uuid = 'f18eec97-86e9-44c4-80b7-c86461f3efbe';
    `);
    console.log(vendorItems);

    console.log('\n✅ Debug complete!');

  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
}

debugTrustPortal(); 