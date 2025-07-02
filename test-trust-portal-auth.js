const fetch = require('node-fetch');

async function testTrustPortalAuth() {
  console.log('🧪 Testing Trust Portal Authentication & Organization Filtering\n');

  const baseUrl = 'http://localhost:3000'; // Local backend
  
  try {
    // Test 1: Call trust portal without authentication (should fail now)
    console.log('📋 Test 1: Trust Portal without authentication (should fail)');
    try {
      const response = await fetch(`${baseUrl}/api/trust-portal/vendors`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('❌ UNEXPECTED: Request succeeded without auth');
        console.log('Response:', data);
      } else {
        console.log('✅ EXPECTED: Request failed without auth');
        console.log('Status:', response.status);
        console.log('Error:', data);
      }
    } catch (error) {
      console.log('✅ EXPECTED: Request failed with error:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Login as prithvi@garnetai.net to get auth token
    console.log('📋 Test 2: Login as prithvi@garnetai.net');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'prithvi@garnetai.net',
        password: 'Test123456!' // You'll need to provide the correct password
      }),
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed. Please check credentials.');
      const loginError = await loginResponse.json();
      console.log('Login error:', loginError);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log('User:', {
      id: loginData.user?.id,
      email: loginData.user?.email,
      organization_id: loginData.user?.organization_id,
      organization: loginData.user?.organization
    });

    const authToken = loginData.access_token;

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Call trust portal WITH authentication
    console.log('📋 Test 3: Trust Portal WITH authentication (should show only user\'s org vendors)');
    const authResponse = await fetch(`${baseUrl}/api/trust-portal/vendors`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Authenticated request successful');
      console.log('Meta:', authData.meta);
      console.log(`Found ${authData.data?.length || 0} vendors for organization`);
      
      if (authData.data && authData.data.length > 0) {
        console.log('Vendors returned:');
        authData.data.forEach((vendor, index) => {
          console.log(`  ${index + 1}. ${vendor.companyName} (Org: ${vendor.organizationId})`);
        });
      }
      
      // Verify organization filtering
      if (authData.meta?.organizationId === '35a8064c-219e-44a6-b4fe-677a23e80200') {
        console.log('✅ CORRECT: Organization ID matches prithvi\'s organization');
        if (authData.data?.length === 1 && authData.data[0].companyName === 'Testing1') {
          console.log('✅ PERFECT: Only showing Testing1 vendor (correct filtering)');
        } else {
          console.log('❌ ISSUE: Expected only Testing1 vendor');
        }
      } else {
        console.log('❌ ISSUE: Wrong organization ID returned:', authData.meta?.organizationId);
      }
    } else {
      console.log('❌ Authenticated request failed');
      const authError = await authResponse.json();
      console.log('Status:', authResponse.status);
      console.log('Error:', authError);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testTrustPortalAuth().catch(console.error); 