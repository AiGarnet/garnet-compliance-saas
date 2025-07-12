console.log('🔍 COMPREHENSIVE API ENDPOINT TESTING AFTER DEPLOYMENT\n');

const baseUrl = 'https://garnet-compliance-saas-production.up.railway.app';

async function testAllAPIs() {
  console.log('1. 📚 Checking API Documentation...');
  try {
    const docsResponse = await fetch(`${baseUrl}/api/docs`);
    console.log(`   API Docs Status: ${docsResponse.status}`);
    if (docsResponse.ok) {
      console.log('   ✅ API Documentation is accessible');
    } else {
      console.log('   ❌ API Documentation not accessible');
    }
  } catch (error) {
    console.log(`   ❌ API Docs Error: ${error.message}`);
  }

  console.log('\n2. 🧪 TESTING TRUST PORTAL FEEDBACK ENDPOINTS...');
  
  // Test 1: POST /api/trust-portal/feedback (main endpoint)
  console.log('\n   A. Testing POST /api/trust-portal/feedback...');
  try {
    const testData = {
      vendorId: 1,
      enterpriseContactName: 'API Test User',
      enterpriseContactEmail: 'apitest@example.com',
      enterpriseCompanyName: 'API Test Corp',
      feedbackType: 'general',
      priority: 'medium',
      subject: 'API Test Subject',
      message: 'Testing API after deployment',
      inviteToken: '1752213296666_ww369dkf4'
    };

    console.log('      Sending data:', JSON.stringify(testData, null, 2));

    const response = await fetch(`${baseUrl}/api/trust-portal/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://www.garnetai.net'
      },
      body: JSON.stringify(testData)
    });

    console.log(`      Status: ${response.status}`);
    const result = await response.text();
    
    if (response.ok) {
      console.log('      ✅ SUCCESS: Main feedback endpoint working');
      const data = JSON.parse(result);
      console.log(`      Created feedback ID: ${data.id}`);
    } else {
      console.log('      ❌ FAILED: Main feedback endpoint not working');
      console.log(`      Error Response: ${result}`);
      
      // Try to parse error for more details
      try {
        const errorData = JSON.parse(result);
        console.log(`      Error Details: ${JSON.stringify(errorData, null, 2)}`);
      } catch (e) {
        console.log('      Raw Error:', result);
      }
    }
  } catch (error) {
    console.log(`      ❌ Network Error: ${error.message}`);
  }

  // Test 2: GET /api/trust-portal/feedback (new endpoint)
  console.log('\n   B. Testing GET /api/trust-portal/feedback...');
  try {
    const response = await fetch(`${baseUrl}/api/trust-portal/feedback`);
    console.log(`      Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('      ✅ CORRECT: Requires authentication (401)');
    } else if (response.status === 404) {
      console.log('      ❌ NOT DEPLOYED: Endpoint not found (404)');
    } else {
      const result = await response.text();
      console.log(`      ⚠️  UNEXPECTED: Status ${response.status}`);
      console.log(`      Response: ${result.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`      ❌ Network Error: ${error.message}`);
  }

  // Test 3: POST /api/trust-portal/vendor/1/feedback (new vendor-specific)
  console.log('\n   C. Testing POST /api/trust-portal/vendor/1/feedback...');
  try {
    const vendorTestData = {
      enterpriseContactName: 'Vendor API Test',
      enterpriseContactEmail: 'vendorapi@example.com',
      enterpriseCompanyName: 'Vendor API Corp',
      feedbackType: 'clarification',
      priority: 'high',
      subject: 'Vendor API Test',
      message: 'Testing vendor-specific endpoint'
    };

    console.log('      Sending data:', JSON.stringify(vendorTestData, null, 2));

    const response = await fetch(`${baseUrl}/api/trust-portal/vendor/1/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://www.garnetai.net'
      },
      body: JSON.stringify(vendorTestData)
    });

    console.log(`      Status: ${response.status}`);
    const result = await response.text();
    
    if (response.ok) {
      console.log('      ✅ SUCCESS: Vendor-specific endpoint working');
      const data = JSON.parse(result);
      console.log(`      Created feedback ID: ${data.id}`);
    } else if (response.status === 404) {
      console.log('      ❌ NOT DEPLOYED: Endpoint not found (404)');
    } else {
      console.log('      ❌ FAILED: Vendor-specific endpoint has issues');
      console.log(`      Error Response: ${result}`);
    }
  } catch (error) {
    console.log(`      ❌ Network Error: ${error.message}`);
  }

  // Test 4: GET /api/trust-portal/vendor/1/feedback
  console.log('\n   D. Testing GET /api/trust-portal/vendor/1/feedback...');
  try {
    const response = await fetch(`${baseUrl}/api/trust-portal/vendor/1/feedback`);
    console.log(`      Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`      ✅ SUCCESS: Retrieved ${result.length} feedback items`);
    } else {
      const error = await response.text();
      console.log('      ❌ FAILED: Cannot retrieve vendor feedback');
      console.log(`      Error: ${error.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`      ❌ Network Error: ${error.message}`);
  }

  console.log('\n3. 🧪 TESTING OTHER TRUST PORTAL ENDPOINTS...');
  
  // Test 5: GET /api/trust-portal/vendors
  console.log('\n   E. Testing GET /api/trust-portal/vendors...');
  try {
    const response = await fetch(`${baseUrl}/api/trust-portal/vendors`);
    console.log(`      Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('      ✅ CORRECT: Requires authentication (401)');
    } else if (response.ok) {
      console.log('      ✅ SUCCESS: Vendors endpoint working');
    } else {
      const result = await response.text();
      console.log(`      ❌ FAILED: Status ${response.status}`);
      console.log(`      Error: ${result.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`      ❌ Network Error: ${error.message}`);
  }

  // Test 6: GET /api/trust-portal/items (with vendorId)
  console.log('\n   F. Testing GET /api/trust-portal/items?vendorId=1...');
  try {
    const response = await fetch(`${baseUrl}/api/trust-portal/items?vendorId=1`);
    console.log(`      Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`      ✅ SUCCESS: Retrieved ${result.length || 0} trust portal items`);
    } else {
      const error = await response.text();
      console.log(`      ❌ FAILED: Status ${response.status}`);
      console.log(`      Error: ${error.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`      ❌ Network Error: ${error.message}`);
  }

  // Test 7: Test with different data formats to identify validation issues
  console.log('\n4. 🔍 TESTING DIFFERENT DATA FORMATS FOR 400 ERROR...');
  
  console.log('\n   G. Testing with minimal required fields...');
  try {
    const minimalData = {
      vendorId: 1,
      enterpriseContactEmail: 'minimal@test.com',
      feedbackType: 'general',
      subject: 'Minimal Test',
      message: 'Testing with minimal fields'
    };

    const response = await fetch(`${baseUrl}/api/trust-portal/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://www.garnetai.net'
      },
      body: JSON.stringify(minimalData)
    });

    console.log(`      Status: ${response.status}`);
    if (response.ok) {
      console.log('      ✅ SUCCESS: Minimal data works');
    } else {
      const result = await response.text();
      console.log('      ❌ FAILED: Even minimal data fails');
      console.log(`      Error: ${result}`);
    }
  } catch (error) {
    console.log(`      ❌ Network Error: ${error.message}`);
  }

  console.log('\n   H. Testing with exact frontend format...');
  try {
    const frontendData = {
      "enterpriseContactEmail": "frontend@test.com",
      "enterpriseContactName": "Frontend Test",
      "enterpriseCompanyName": "Frontend Corp",
      "feedbackType": "general",
      "priority": "medium",
      "subject": "Frontend Format Test",
      "message": "Testing exact frontend format",
      "vendorId": 1,
      "inviteToken": "1752213296666_ww369dkf4"
    };

    const response = await fetch(`${baseUrl}/api/trust-portal/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://www.garnetai.net',
        'Referer': 'https://www.garnetai.net/trust-portal/invite/?token=1752213296666_ww369dkf4'
      },
      body: JSON.stringify(frontendData)
    });

    console.log(`      Status: ${response.status}`);
    if (response.ok) {
      console.log('      ✅ SUCCESS: Frontend format works');
    } else {
      const result = await response.text();
      console.log('      ❌ FAILED: Frontend format fails');
      console.log(`      Error: ${result}`);
    }
  } catch (error) {
    console.log(`      ❌ Network Error: ${error.message}`);
  }

  console.log('\n🎯 SUMMARY & RECOMMENDATIONS:');
  console.log('   - Check which endpoints returned 200/201 (working)');
  console.log('   - Check which endpoints returned 404 (not deployed)');
  console.log('   - Check which endpoints returned 400 (validation issues)');
  console.log('   - Check which endpoints returned 401 (auth required)');
  console.log('   - Focus on the specific 400 error details for debugging');
}

testAllAPIs().catch(console.error); 