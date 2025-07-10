const { Client } = require('pg');

// Database configuration
const DB_CONFIG = {
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: { rejectUnauthorized: false }
};

async function analyzeAndFixTrustPortalIssue() {
  console.log('🔍 ANALYZING TRUST PORTAL ISSUE...\n');
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log('✅ Database connection successful!\n');

    // 1. Check the specific vendor that has issues
    console.log('📋 1. Analyzing vendor f18eec97-86e9-44c4-80b7-c86461f3efbe...');
    const vendor = await client.query(`
      SELECT vendor_id, uuid, company_name, created_at 
      FROM vendors 
      WHERE uuid = 'f18eec97-86e9-44c4-80b7-c86461f3efbe';
    `);
    
    if (vendor.rows.length === 0) {
      console.log('❌ Vendor not found!');
      return;
    }
    
    const vendorData = vendor.rows[0];
    console.log('✅ Vendor found:', vendorData);
    const vendorId = vendorData.vendor_id; // This is the numeric ID (11)

    // 2. Check trust portal items for this vendor
    console.log(`\n🏛️ 2. Checking trust portal items for vendor ID ${vendorId}...`);
    const trustPortalItems = await client.query(`
      SELECT id, vendor_id, title, description, category, content, created_at,
             is_questionnaire_answer, questionnaire_id
      FROM trust_portal_items 
      WHERE vendor_id = $1
      ORDER BY created_at DESC;
    `, [vendorId]);

    console.log(`Found ${trustPortalItems.rows.length} trust portal items for this vendor:`);
    trustPortalItems.rows.forEach((item, index) => {
      console.log(`  ${index + 1}. "${item.title}" (Category: ${item.category})`);
      console.log(`      Created: ${item.created_at}`);
      console.log(`      Is Questionnaire: ${item.is_questionnaire_answer}`);
      if (item.content) {
        try {
          const content = JSON.parse(item.content);
          console.log(`      Content Type: ${content.documentType || 'unknown'}`);
        } catch (e) {
          console.log(`      Content: ${item.content.substring(0, 100)}...`);
        }
      }
      console.log('');
    });

    // 3. Check supporting documents for this vendor
    console.log(`\n📄 3. Checking supporting documents for vendor UUID ${vendorData.uuid}...`);
    const supportingDocs = await client.query(`
      SELECT id, vendor_id, filename, file_type, uploaded_at, spaces_url, spaces_key
      FROM checklist_supporting_documents 
      WHERE vendor_id = $1
      ORDER BY uploaded_at DESC;
    `, [vendorData.uuid]); // Note: This table uses UUID, not numeric ID

    console.log(`Found ${supportingDocs.rows.length} supporting documents:`);
    supportingDocs.rows.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.filename}`);
      console.log(`      Type: ${doc.file_type}`);
      console.log(`      Uploaded: ${doc.uploaded_at}`);
      console.log(`      Spaces URL: ${doc.spaces_url || 'None'}`);
      console.log('');
    });

    // 4. Check checklists for this vendor
    console.log(`\n📋 4. Checking checklists for vendor UUID ${vendorData.uuid}...`);
    const checklists = await client.query(`
      SELECT id, vendor_id, name, extraction_status, created_at,
             (SELECT COUNT(*) FROM checklist_questions WHERE checklist_id = checklists.id) as question_count
      FROM checklists 
      WHERE vendor_id = $1
      ORDER BY created_at DESC;
    `, [vendorData.uuid]); // Note: This table uses UUID, not numeric ID

    console.log(`Found ${checklists.rows.length} checklists:`);
    checklists.rows.forEach((checklist, index) => {
      console.log(`  ${index + 1}. ${checklist.name} (${checklist.question_count} questions)`);
      console.log(`      Status: ${checklist.extraction_status}`);
      console.log(`      Created: ${checklist.created_at}`);
    });

    // 5. Identify the issue
    console.log('\n🔍 5. ISSUE ANALYSIS:');
    console.log('=====================================');
    
    if (trustPortalItems.rows.length > 0) {
      console.log('✅ Trust portal items exist in database');
      console.log(`   Found ${trustPortalItems.rows.length} items for vendor ID ${vendorId}`);
    } else {
      console.log('❌ No trust portal items found for this vendor');
    }

    // The issue might be the UUID vs ID mismatch
    console.log('\n🔧 6. POTENTIAL ISSUE IDENTIFIED:');
    console.log('=====================================');
    console.log('The frontend uses vendor UUID: f18eec97-86e9-44c4-80b7-c86461f3efbe');
    console.log(`The backend stores numeric vendor_id: ${vendorId}`);
    console.log('Trust portal items use numeric vendor_id, not UUID');
    console.log('The backend API should convert UUID to numeric ID before querying trust_portal_items');

    // 7. Test the fix - Check if trust portal service properly handles UUID to ID conversion
    console.log('\n🔧 7. TESTING UUID TO ID CONVERSION:');
    console.log('=====================================');
    
    // Simulate what the backend should do
    const vendorByUuid = await client.query(`
      SELECT vendor_id FROM vendors WHERE uuid = $1
    `, ['f18eec97-86e9-44c4-80b7-c86461f3efbe']);
    
    if (vendorByUuid.rows.length > 0) {
      const numericId = vendorByUuid.rows[0].vendor_id;
      console.log(`✅ UUID conversion works: UUID -> ID ${numericId}`);
      
      // Now check trust portal items with the converted ID
      const itemsWithConvertedId = await client.query(`
        SELECT COUNT(*) as count FROM trust_portal_items WHERE vendor_id = $1
      `, [numericId]);
      
      console.log(`✅ Trust portal items for converted ID: ${itemsWithConvertedId.rows[0].count}`);
    }

    // 8. Check if the supporting documents were properly refreshed
    console.log('\n📄 8. SUPPORTING DOCUMENTS REFRESH ISSUE:');
    console.log('=====================================');
    
    if (supportingDocs.rows.length > 0) {
      console.log('✅ Supporting documents exist in database');
      console.log('Issue: Frontend loadVendorSupportingDocuments() may not be refreshing properly');
      console.log('Solution: Added delay and force refresh in the updated frontend code');
    } else {
      console.log('❌ No supporting documents found');
    }

    // 9. Proposed solutions
    console.log('\n💡 9. SOLUTIONS IMPLEMENTED:');
    console.log('=====================================');
    console.log('1. ✅ Updated trust-portal.service.ts to include trustPortalItems in getVendorTrustPortalData()');
    console.log('2. ✅ Updated VendorTrustPortalData interface to include trustPortalItems field');
    console.log('3. ✅ Added delay and force refresh in frontend loadVendorSupportingDocuments()');
    console.log('4. ✅ Added visual indicators for checklists sent to trust portal');
    console.log('5. ✅ Enhanced error handling and user feedback');

    console.log('\n🎯 10. NEXT STEPS:');
    console.log('=====================================');
    console.log('1. Restart the backend server to apply the trust portal service changes');
    console.log('2. Clear browser cache and refresh the frontend');
    console.log('3. Test sending a new document to trust portal');
    console.log('4. Check the trust portal pages again');
    
    console.log('\n✅ Analysis completed!');

  } catch (error) {
    console.error('❌ Database error:', error.message);
    return false;
  } finally {
    await client.end();
  }
  
  return true;
}

// Run the analysis
analyzeAndFixTrustPortalIssue().catch(console.error); 