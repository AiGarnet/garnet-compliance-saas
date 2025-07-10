const https = require('https');

// Test the deployed backend to see what version it's running
async function checkBackendVersion() {
  console.log('🔍 CHECKING BACKEND VERSION AND TRUST PORTAL STATUS\n');
  
  // Test health endpoint to see version info
  const healthUrl = 'https://garnet-compliance-saas-production.up.railway.app/health';
  
  try {
    const result = await makeRequest(healthUrl);
    
    if (result.status === 200) {
      console.log('✅ Backend is online');
      console.log('📊 Health info:', JSON.stringify(result.data, null, 2));
      
      if (result.data.version) {
        console.log(`🏷️  Version: ${result.data.version}`);
      }
      
      if (result.data.modules) {
        console.log('📦 Modules available:');
        Object.keys(result.data.modules).forEach(module => {
          console.log(`   - ${module}`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Failed to get health info:', error.message);
  }
}

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            parseError: true
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testDirectTrustPortalItemsEndpoint() {
  console.log('\n🔍 TESTING DIRECT TRUST PORTAL ITEMS ENDPOINT\n');
  
  // Try to access trust portal items directly
  const vendor_id = 11;
  
  // Test different potential endpoints
  const endpoints = [
    `/api/trust-portal/items?vendorId=${vendor_id}`,
    `/api/trust-portal/items/${vendor_id}`,
    `/api/trust-portal/vendor/${vendor_id}/items`,
    `/api/trust-portal/items`
  ];
  
  for (const endpoint of endpoints) {
    const url = `https://garnet-compliance-saas-production.up.railway.app${endpoint}`;
    console.log(`🔗 Testing: ${endpoint}`);
    
    try {
      const result = await makeRequest(url);
      console.log(`   📊 Status: ${result.status}`);
      
      if (result.status === 200 && result.data) {
        if (Array.isArray(result.data)) {
          console.log(`   ✅ Success: Array with ${result.data.length} items`);
          if (result.data.length > 0) {
            console.log(`   📄 Sample:`, JSON.stringify(result.data[0], null, 2).substring(0, 150) + '...');
          }
        } else {
          console.log(`   ✅ Success: Object response`);
          console.log(`   📄 Data:`, JSON.stringify(result.data, null, 2).substring(0, 200) + '...');
        }
      } else if (result.status === 404) {
        console.log(`   ⚠️ Not found (404)`);
      } else if (result.status === 401) {
        console.log(`   🔒 Unauthorized (401) - might need authentication`);
      } else {
        console.log(`   ❌ Error: ${result.status}`);
        if (result.data) {
          console.log(`   📄 Error:`, JSON.stringify(result.data, null, 2).substring(0, 150) + '...');
        }
      }
    } catch (error) {
      console.log(`   💥 Failed: ${error.message}`);
    }
    console.log('');
  }
}

async function createTestTrustPortalItem() {
  console.log('\n🧪 TESTING CREATE TRUST PORTAL ITEM\n');
  
  const createUrl = 'https://garnet-compliance-saas-production.up.railway.app/api/trust-portal/items';
  
  const testItem = {
    vendorId: 11,
    title: 'Test Item - Backend Verification',
    description: 'This is a test item to verify the trust portal backend is working correctly.',
    category: 'Testing',
    isQuestionnaireAnswer: false
  };
  
  try {
    const result = await makePostRequest(createUrl, testItem);
    console.log(`📊 Create Status: ${result.status}`);
    
    if (result.status === 201 || result.status === 200) {
      console.log('✅ Successfully created test item!');
      console.log('📄 Created item:', JSON.stringify(result.data, null, 2));
      
      // Now test if we can retrieve it
      console.log('\n🔍 Verifying retrieval after creation...');
      const vendorUrl = 'https://garnet-compliance-saas-production.up.railway.app/api/trust-portal/vendor/f18eec97-86e9-44c4-80b7-c86461f3efbe';
      const getResult = await makeRequest(vendorUrl);
      
      if (getResult.status === 200 && getResult.data.trustPortalItems) {
        console.log(`✅ Retrieval works! Found ${getResult.data.trustPortalItems.length} trust portal items`);
      } else {
        console.log('❌ Retrieval still not working - deployment issue confirmed');
      }
      
    } else {
      console.log('❌ Failed to create test item');
      console.log('📄 Error:', JSON.stringify(result.data, null, 2));
    }
  } catch (error) {
    console.log(`💥 Create failed: ${error.message}`);
  }
}

async function makePostRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(responseData)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData,
            parseError: true
          });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runDiagnostics() {
  await checkBackendVersion();
  await testDirectTrustPortalItemsEndpoint();
  await createTestTrustPortalItem();
  
  console.log('\n' + '='.repeat(70));
  console.log('🎯 DEPLOYMENT DIAGNOSIS:');
  console.log('='.repeat(70));
  console.log('Based on the tests above:');
  console.log('');
  console.log('If trust portal items are missing from vendor endpoint:');
  console.log('1. 🔄 The backend deployment is missing the latest code changes');
  console.log('2. 🚀 Need to trigger a redeployment to Railway');
  console.log('3. 📝 The database has the data but the API code is outdated');
  console.log('');
  console.log('If creating items works but retrieval doesn\'t:');
  console.log('1. 🔧 There\'s a bug in the getVendorTrustPortalData method');
  console.log('2. 🔄 The changes haven\'t been deployed yet');
  console.log('');
  console.log('🛠️ NEXT STEPS:');
  console.log('1. Check Railway deployment logs');
  console.log('2. Trigger a manual redeployment');
  console.log('3. Verify the latest code is in the deployment');
}

runDiagnostics().catch(console.error); 