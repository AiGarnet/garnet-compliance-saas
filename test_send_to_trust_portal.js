const fetch = require('node-fetch');

async function testSendToTrustPortal() {
  try {
    console.log('🚀 Testing Send to Trust Portal functionality...\n');

    // Test data from the database analysis
    const checklistId = 'cf941899-32c9-45d5-8fba-69b6aad74a41';
    const vendorUuid = 'ae9af69a-24aa-4477-aedd-cdecef57aae4';
    const backendUrl = 'https://garnet-compliance-saas-production.up.railway.app';
    
    console.log(`📋 Checklist ID: ${checklistId}`);
    console.log(`🏢 Vendor UUID: ${vendorUuid}`);
    console.log(`🌐 Backend URL: ${backendUrl}\n`);

    // Prepare the request data
    const submitData = {
      title: 'questions_1.txt - Complete Compliance Questionnaire',
      message: 'Completed compliance questionnaire with 3 answered questions. All requirements verified and ready for enterprise review.',
      isFollowUp: false,
      followUpType: 'initial',
      followUpReason: '',
      parentSubmissionId: null
    };

    console.log('📤 Request Data:', JSON.stringify(submitData, null, 2));

    // Make the API call to send checklist to trust portal
    const response = await fetch(`${backendUrl}/api/checklists/${checklistId}/vendor/${vendorUuid}/send-to-trust-portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submitData)
    });

    console.log(`\n📡 Response Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS! Checklist sent to trust portal');
      console.log('📄 Response:', JSON.stringify(result, null, 2));
      
      // Now verify the trust portal item was created
      console.log('\n🔍 Verifying trust portal item was created...');
      
      // Wait a moment for the database to update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if trust portal item was created
      const { Client } = require('pg');
      const client = new Client({
        connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
        ssl: { rejectUnauthorized: false }
      });
      
      await client.connect();
      
      // Get vendor numeric ID
      const vendorQuery = `SELECT vendor_id FROM vendors WHERE uuid = $1`;
      const vendorResult = await client.query(vendorQuery, [vendorUuid]);
      const vendorId = vendorResult.rows[0]?.vendor_id;
      
      if (vendorId) {
        console.log(`🔍 Vendor numeric ID: ${vendorId}`);
        
        // Check trust portal items
        const trustPortalQuery = `
          SELECT id, title, category, is_questionnaire_answer, questionnaire_id, 
                 LENGTH(content) as content_length, created_at
          FROM trust_portal_items 
          WHERE vendor_id = $1
          ORDER BY created_at DESC
        `;
        const trustPortalResult = await client.query(trustPortalQuery, [vendorId]);
        
        console.log(`\n📊 Trust portal items found: ${trustPortalResult.rows.length}`);
        
        if (trustPortalResult.rows.length > 0) {
          trustPortalResult.rows.forEach((item, index) => {
            console.log(`\n  ${index + 1}. ${item.title}`);
            console.log(`     - ID: ${item.id}`);
            console.log(`     - Category: ${item.category}`);
            console.log(`     - Is Questionnaire: ${item.is_questionnaire_answer ? '✅' : '❌'}`);
            console.log(`     - Questionnaire ID: ${item.questionnaire_id || 'N/A'}`);
            console.log(`     - Content Length: ${item.content_length} chars`);
            console.log(`     - Created: ${item.created_at}`);
          });
          
          console.log('\n🎉 SUCCESS! Trust portal item created successfully!');
          console.log(`\n🔗 Test the frontend with vendor UUID: ${vendorUuid}`);
          console.log(`   Frontend URL: http://localhost:3000/trust-portal/vendor?id=${vendorUuid}`);
        } else {
          console.log('❌ No trust portal items found after sending');
        }
      }
      
      await client.end();
      
    } else {
      const errorText = await response.text();
      console.log('❌ FAILED to send checklist to trust portal');
      console.log('📄 Error Response:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('📄 Parsed Error:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.log('📄 Raw Error Text:', errorText);
      }
    }

  } catch (error) {
    console.error('❌ Error testing send to trust portal:', error);
  }
}

testSendToTrustPortal(); 