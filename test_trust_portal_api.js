const fetch = require('node-fetch');

async function testTrustPortalAPI() {
  try {
    console.log('🔍 Testing Trust Portal API endpoint...\n');

    const backendUrl = 'https://garnet-compliance-saas-production.up.railway.app';
    const vendorUuid = 'ae9af69a-24aa-4477-aedd-cdecef57aae4'; // Testing1 vendor with data
    
    console.log(`🌐 Backend URL: ${backendUrl}`);
    console.log(`🏢 Testing Vendor UUID: ${vendorUuid}\n`);

    // Test the trust portal API endpoint that the frontend calls
    const apiEndpoint = `${backendUrl}/api/trust-portal/vendor/${vendorUuid}`;
    console.log(`📡 Testing endpoint: ${apiEndpoint}`);

    const response = await fetch(apiEndpoint);
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ SUCCESS! API returned data');
      
      // Check the structure
      console.log('\n📄 Response Structure:');
      console.log(`- vendor: ${data.vendor ? '✅' : '❌'}`);
      console.log(`- trustPortalItems: ${data.trustPortalItems ? '✅' : '❌'} (${data.trustPortalItems?.length || 0} items)`);
      console.log(`- checklists: ${data.checklists ? '✅' : '❌'} (${data.checklists?.length || 0} items)`);
      console.log(`- documents: ${data.documents ? '✅' : '❌'} (${data.documents?.length || 0} items)`);

      // Check trust portal items specifically
      if (data.trustPortalItems && data.trustPortalItems.length > 0) {
        console.log('\n🏛️ Trust Portal Items:');
        data.trustPortalItems.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.title}`);
          console.log(`     - ID: ${item.id}`);
          console.log(`     - Category: ${item.category}`);
          console.log(`     - Is Questionnaire: ${item.isQuestionnaireAnswer}`);
          console.log(`     - Questionnaire ID: ${item.questionnaireId || 'N/A'}`);
          console.log(`     - Created: ${item.createdAt}`);
        });
      } else {
        console.log('\n❌ No trust portal items found in API response');
      }

      // Check if checklists are parsed from trust portal items
      if (data.checklists && data.checklists.length > 0) {
        console.log('\n📋 Parsed Checklists:');
        data.checklists.forEach((checklist, index) => {
          console.log(`  ${index + 1}. ${checklist.name}`);
          console.log(`     - ID: ${checklist.id}`);
          console.log(`     - Questions: ${checklist.questions?.length || 0}`);
        });
      } else {
        console.log('\n❌ No checklists found in API response');
      }

    } else {
      console.log('\n❌ API request failed');
      const errorText = await response.text();
      console.log('Error Response:', errorText);
    }

    // Also test a send operation
    console.log('\n' + '='.repeat(60));
    console.log('🚀 Testing Send to Trust Portal endpoint...\n');

    // Use the checklist we know exists
    const checklistId = 'cf941899-32c9-45d5-8fba-69b6aad74a41';
    const sendEndpoint = `${backendUrl}/api/checklists/${checklistId}/vendor/${vendorUuid}/send-to-trust-portal`;
    
    console.log(`📡 Send endpoint: ${sendEndpoint}`);
    
    const sendData = {
      title: 'Test Send - questions_1.txt',
      message: 'Testing send to trust portal functionality',
      isFollowUp: true,
      followUpType: 'follow_up',
      followUpReason: 'Testing API consistency'
    };

    const sendResponse = await fetch(sendEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendData)
    });

    console.log(`📊 Send Response Status: ${sendResponse.status} ${sendResponse.statusText}`);

    if (sendResponse.ok) {
      const sendResult = await sendResponse.json();
      console.log('✅ Send successful:', sendResult);
    } else {
      const sendError = await sendResponse.text();
      console.log('❌ Send failed:', sendError);
    }

  } catch (error) {
    console.error('❌ Error testing trust portal API:', error);
  }
}

testTrustPortalAPI(); 