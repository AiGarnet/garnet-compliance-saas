const https = require('https');

// Test configuration
const BACKEND_URL = 'https://garnet-compliance-saas-production.up.railway.app';
const TEST_USER_ID = '9364d5e7-a67f-4f1a-954d-5a6a0c463f2d'; // From your console log

console.log('🔧 Recent Activities Debug Test');
console.log('==================================');
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Test User ID: ${TEST_USER_ID}`);
console.log('');

// Helper function to make HTTPS requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (err) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: err.message
          });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
}

async function testActivitiesEndpoints() {
  console.log('📋 Testing Activities Endpoints...\n');
  
  try {
    // Test 1: Recent Activities endpoint
    console.log('1️⃣ Testing Recent Activities Endpoint:');
    console.log(`   GET ${BACKEND_URL}/api/activities/recent?limit=10&userId=${TEST_USER_ID}`);
    
    const recentResponse = await makeRequest(
      `${BACKEND_URL}/api/activities/recent?limit=10&userId=${TEST_USER_ID}`,
      { 
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DebugScript/1.0'
        }
      }
    );
    
    console.log(`   Status: ${recentResponse.status}`);
    console.log(`   Content-Type: ${recentResponse.headers['content-type']}`);
    
    if (recentResponse.parseError) {
      console.log(`   ❌ JSON Parse Error: ${recentResponse.parseError}`);
      console.log(`   Raw Data: ${recentResponse.data.substring(0, 200)}...`);
    } else {
      console.log(`   ✅ Response Structure:`);
      console.log(`      - success: ${recentResponse.data.success}`);
      console.log(`      - data type: ${Array.isArray(recentResponse.data.data) ? 'array' : typeof recentResponse.data.data}`);
      console.log(`      - data length: ${recentResponse.data.data?.length || 'N/A'}`);
      
      if (recentResponse.data.data && recentResponse.data.data.length > 0) {
        const firstActivity = recentResponse.data.data[0];
        console.log(`      - First activity keys: ${Object.keys(firstActivity).join(', ')}`);
        console.log(`      - First activity type: ${firstActivity.type}`);
        console.log(`      - First activity description: ${firstActivity.description}`);
      }
      
      if (recentResponse.data.error) {
        console.log(`      - Error: ${JSON.stringify(recentResponse.data.error, null, 2)}`);
      }
    }
    
    console.log('');
    
    // Test 2: All Activities endpoint
    console.log('2️⃣ Testing All Activities Endpoint:');
    console.log(`   GET ${BACKEND_URL}/api/activities?userId=${TEST_USER_ID}`);
    
    const allResponse = await makeRequest(
      `${BACKEND_URL}/api/activities?userId=${TEST_USER_ID}`,
      { 
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DebugScript/1.0'
        }
      }
    );
    
    console.log(`   Status: ${allResponse.status}`);
    console.log(`   Content-Type: ${allResponse.headers['content-type']}`);
    
    if (allResponse.parseError) {
      console.log(`   ❌ JSON Parse Error: ${allResponse.parseError}`);
      console.log(`   Raw Data: ${allResponse.data.substring(0, 200)}...`);
    } else {
      console.log(`   ✅ Response Structure:`);
      console.log(`      - success: ${allResponse.data.success}`);
      console.log(`      - data type: ${Array.isArray(allResponse.data.data) ? 'array' : typeof allResponse.data.data}`);
      console.log(`      - data length: ${allResponse.data.data?.length || 'N/A'}`);
      
      if (allResponse.data.error) {
        console.log(`      - Error: ${JSON.stringify(allResponse.data.error, null, 2)}`);
      }
    }
    
    console.log('');
    
    // Test 3: Check if activities table has data
    console.log('3️⃣ Recommendations:');
    
    if (recentResponse.data.success && (!recentResponse.data.data || recentResponse.data.data.length === 0)) {
      console.log('   📝 No activities found - this could mean:');
      console.log('      1. The activities table is empty');
      console.log('      2. No activities for this user ID');
      console.log('      3. Activities are not being created when vendors are added/updated/deleted');
      console.log('');
      console.log('   🔧 To fix this, ensure:');
      console.log('      1. Activity logging is enabled in vendor operations');
      console.log('      2. The ActivityLoggingInterceptor is working');
      console.log('      3. Activities are being written to the database');
    } else if (recentResponse.data.success) {
      console.log('   ✅ Activities are being returned from the backend');
      console.log('   🔧 Frontend issue - check the transformation logic in useActivity.ts');
    } else {
      console.log('   ❌ Backend is returning an error - check the activities service');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testActivitiesEndpoints(); 