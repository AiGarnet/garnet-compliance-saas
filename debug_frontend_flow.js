const fetch = require('node-fetch');
const { Client } = require('pg');

async function debugFrontendFlow() {
  try {
    console.log('🔍 Debugging Frontend to Trust Portal Flow...\n');

    // Database connection
    const client = new Client({
      connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    const backendUrl = 'https://garnet-compliance-saas-production.up.railway.app';
    
    // Step 1: Get a vendor with checklist data
    console.log('1️⃣ Finding vendors with checklists...');
    const vendorsWithChecklistsQuery = `
      SELECT v.vendor_id, v.uuid, v.company_name,
             COUNT(c.id) as checklist_count,
             COUNT(tpi.id) as trust_portal_count
      FROM vendors v
      LEFT JOIN checklists c ON v.uuid = c.vendor_id
      LEFT JOIN trust_portal_items tpi ON v.vendor_id = tpi.vendor_id
      GROUP BY v.vendor_id, v.uuid, v.company_name
      HAVING COUNT(c.id) > 0
      ORDER BY checklist_count DESC
    `;
    
    const vendorsResult = await client.query(vendorsWithChecklistsQuery);
    console.log(`Found ${vendorsResult.rows.length} vendors with checklists:`);
    
    vendorsResult.rows.forEach((vendor, index) => {
      console.log(`  ${index + 1}. ${vendor.company_name}`);
      console.log(`     - Vendor ID: ${vendor.vendor_id}, UUID: ${vendor.uuid}`);
      console.log(`     - Checklists: ${vendor.checklist_count}, Trust Portal Items: ${vendor.trust_portal_count}`);
    });

    if (vendorsResult.rows.length === 0) {
      console.log('❌ No vendors with checklists found');
      return;
    }

    // Use the first vendor
    const testVendor = vendorsResult.rows[0];
    console.log(`\n🎯 Testing with vendor: ${testVendor.company_name} (${testVendor.uuid})`);

    // Step 2: Get checklists for this vendor
    console.log('\n2️⃣ Getting checklists for vendor...');
    const checklistsQuery = `
      SELECT c.id, c.name, c.extraction_status, c.question_count,
             COUNT(cq.id) as actual_questions,
             COUNT(CASE WHEN cq.ai_answer IS NOT NULL AND cq.ai_answer != '' THEN 1 END) as answered_questions
      FROM checklists c
      LEFT JOIN checklist_questions cq ON c.id = cq.checklist_id
      WHERE c.vendor_id = $1
      GROUP BY c.id, c.name, c.extraction_status, c.question_count
      ORDER BY c.created_at DESC
    `;
    
    const checklistsResult = await client.query(checklistsQuery, [testVendor.uuid]);
    console.log(`Found ${checklistsResult.rows.length} checklists:`);
    
    checklistsResult.rows.forEach((checklist, index) => {
      const isReady = checklist.actual_questions > 0 && checklist.answered_questions === checklist.actual_questions;
      console.log(`  ${index + 1}. ${checklist.name}`);
      console.log(`     - ID: ${checklist.id}`);
      console.log(`     - Status: ${checklist.extraction_status}`);
      console.log(`     - Questions: ${checklist.actual_questions}/${checklist.question_count} answered`);
      console.log(`     - Ready for Trust Portal: ${isReady ? '✅' : '❌'}`);
    });

    const readyChecklists = checklistsResult.rows.filter(c => 
      c.actual_questions > 0 && c.answered_questions === c.actual_questions
    );

    if (readyChecklists.length === 0) {
      console.log('\n❌ No checklists ready for trust portal');
      return;
    }

    const testChecklist = readyChecklists[0];
    console.log(`\n🎯 Testing with checklist: ${testChecklist.name} (${testChecklist.id})`);

    // Step 3: Simulate the frontend "Send to Trust Portal" request
    console.log('\n3️⃣ Simulating frontend send to trust portal request...');
    
    const frontendData = {
      title: `${testChecklist.name} - Complete Compliance Questionnaire`,
      message: `Completed compliance questionnaire with ${testChecklist.actual_questions} answered questions. All requirements verified and ready for enterprise review.`,
      isFollowUp: false,
      followUpType: 'initial',
      followUpReason: '',
      parentSubmissionId: null
    };

    console.log('📤 Request Data:', JSON.stringify(frontendData, null, 2));

    const sendEndpoint = `${backendUrl}/api/checklists/${testChecklist.id}/vendor/${testVendor.uuid}/send-to-trust-portal`;
    console.log(`📡 Endpoint: ${sendEndpoint}`);

    // Make the request
    const response = await fetch(sendEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(frontendData)
    });

    console.log(`\n📊 Response: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS! Response:', JSON.stringify(result, null, 2));
      
      // Step 4: Verify the trust portal item was created
      console.log('\n4️⃣ Verifying trust portal item creation...');
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const verifyQuery = `
        SELECT id, title, category, is_questionnaire_answer, questionnaire_id, created_at
        FROM trust_portal_items 
        WHERE vendor_id = $1 AND questionnaire_id = $2
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const verifyResult = await client.query(verifyQuery, [testVendor.vendor_id, testChecklist.id]);
      
      if (verifyResult.rows.length > 0) {
        const item = verifyResult.rows[0];
        console.log('✅ Trust portal item found:');
        console.log(`   - ID: ${item.id}`);
        console.log(`   - Title: ${item.title}`);
        console.log(`   - Category: ${item.category}`);
        console.log(`   - Is Questionnaire: ${item.is_questionnaire_answer}`);
        console.log(`   - Questionnaire ID: ${item.questionnaire_id}`);
        console.log(`   - Created: ${item.created_at}`);
      } else {
        console.log('❌ Trust portal item not found in database');
      }

      // Step 5: Test the trust portal API endpoint
      console.log('\n5️⃣ Testing trust portal API endpoint...');
      
      const apiEndpoint = `${backendUrl}/api/trust-portal/vendor/${testVendor.uuid}`;
      console.log(`📡 API Endpoint: ${apiEndpoint}`);
      
      const apiResponse = await fetch(apiEndpoint);
      console.log(`📊 API Response: ${apiResponse.status} ${apiResponse.statusText}`);
      
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        console.log('✅ API returned data:');
        console.log(`   - Trust Portal Items: ${apiData.trustPortalItems?.length || 0}`);
        console.log(`   - Checklists: ${apiData.checklists?.length || 0}`);
        console.log(`   - Documents: ${apiData.documents?.length || 0}`);
        
        if (apiData.trustPortalItems && apiData.trustPortalItems.length > 0) {
          console.log('\n📄 Trust Portal Items:');
          apiData.trustPortalItems.forEach((item, index) => {
            console.log(`     ${index + 1}. ${item.title}`);
            console.log(`        - Is Questionnaire: ${item.isQuestionnaireAnswer}`);
            console.log(`        - Category: ${item.category}`);
          });
        }
      } else {
        const apiError = await apiResponse.text();
        console.log('❌ API request failed:', apiError);
      }

    } else {
      const errorResponse = await response.text();
      console.log('❌ Send request failed:', errorResponse);
      
      try {
        const errorJson = JSON.parse(errorResponse);
        console.log('📄 Parsed error:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.log('📄 Raw error:', errorResponse);
      }
    }

    await client.end();

  } catch (error) {
    console.error('❌ Error in debug flow:', error);
  }
}

debugFrontendFlow(); 