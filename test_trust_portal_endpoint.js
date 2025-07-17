const fetch = require('node-fetch');

// Test the trust portal submission endpoint
async function testTrustPortalEndpoint() {
  const backendUrl = 'https://garnet-compliance-saas-production.up.railway.app';
  
  // Use the vendor UUID and checklist ID from our debug results
  const vendorUuid = 'ae9af69a-24aa-4477-aedd-cdecef57aae4';
  const checklistId = '42608bfd-2050-48c6-91f6-3f359308a0c3';
  
  const testData = {
    title: 'Test Checklist - Complete Compliance Questionnaire',
    message: 'Test submission to verify endpoint is working',
    isFollowUp: false,
    followUpType: 'initial',
    followUpReason: null,
    parentSubmissionId: null
  };
  
  console.log('Testing trust portal submission endpoint...');
  console.log('Vendor UUID:', vendorUuid);
  console.log('Checklist ID:', checklistId);
  console.log('Test Data:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch(
      `${backendUrl}/api/checklists/${checklistId}/vendor/${vendorUuid}/send-to-trust-portal`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      }
    );
    
    console.log('\nResponse Status:', response.status);
    console.log('Response Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('Response Body:', responseText);
    
    if (response.ok) {
      console.log('\n✅ SUCCESS: Trust portal submission endpoint is working!');
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('Parsed Response:', JSON.stringify(jsonResponse, null, 2));
      } catch (e) {
        console.log('Response is not JSON:', responseText);
      }
    } else {
      console.log('\n❌ ERROR: Trust portal submission failed');
      console.log('Status:', response.status);
      console.log('Error:', responseText);
    }
    
  } catch (error) {
    console.error('\n❌ NETWORK ERROR:', error.message);
  }
}

testTrustPortalEndpoint(); 