const fetch = require('node-fetch');

// Test invite token generation
async function testInviteTokenGeneration() {
  console.log('🧪 Testing Invite Token Generation...\n');

  try {
    // Test with vendor ID 1 (assuming it exists)
    const vendorId = 1;
    const apiUrl = 'https://garnet-compliance-saas-production.up.railway.app'; // Railway backend URL
    
    console.log(`Testing with vendor ID: ${vendorId}`);
    console.log(`API URL: ${apiUrl}/api/vendors/${vendorId}/generate-invite-token\n`);

    const response = await fetch(`${apiUrl}/api/vendors/${vendorId}/generate-invite-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log(`Response Status: ${response.status}`);

    const data = await response.json();
    console.log('\nResponse Data:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success && data.data?.inviteToken) {
      console.log('\n✅ SUCCESS: Invite token generated successfully!');
      console.log(`Token: ${data.data.inviteToken}`);
      console.log(`Expires: ${data.data.expiresAt}`);
      console.log(`Invite Link: ${data.data.inviteLink}`);
      
      // Test the actual invite link
      console.log('\n🔗 Testing the generated invite link...');
      const inviteResponse = await fetch(`${apiUrl}/api/trust-portal/invite/${data.data.inviteToken}`);
      console.log(`Invite Link Status: ${inviteResponse.status}`);
      
      if (inviteResponse.ok) {
        const inviteData = await inviteResponse.json();
        console.log('✅ Invite link works! Vendor data retrieved successfully.');
        console.log(`Vendor: ${inviteData.vendor?.companyName || 'N/A'}`);
      } else {
        console.log('❌ Invite link failed');
        const errorData = await inviteResponse.json();
        console.log('Error:', errorData);
      }
    } else {
      console.log('\n❌ FAILED: No invite token in response');
      if (data.error) {
        console.log(`Error: ${data.error.message}`);
      }
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('\n💡 Make sure the backend is accessible at:');
    console.log('   https://garnet-compliance-saas-production.up.railway.app');
  }
}

// Also test with different vendor IDs
async function testMultipleVendors() {
  console.log('\n🔄 Testing with multiple vendor IDs...\n');
  const vendorIds = [1, 2, 3];
  
  for (const vendorId of vendorIds) {
    console.log(`\n--- Testing Vendor ID: ${vendorId} ---`);
    try {
      const response = await fetch(`https://garnet-compliance-saas-production.up.railway.app/api/vendors/${vendorId}/generate-invite-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      if (data.success) {
        console.log(`✅ Vendor ${vendorId}: Token generated successfully`);
        console.log(`   Token: ${data.data.inviteToken}`);
      } else {
        console.log(`❌ Vendor ${vendorId}: ${data.error?.message || 'Failed'}`);
      }
    } catch (error) {
      console.log(`❌ Vendor ${vendorId}: ${error.message}`);
    }
  }
}

// Run the tests
async function runTests() {
  await testInviteTokenGeneration();
  await testMultipleVendors();
}

runTests().catch(console.error); 