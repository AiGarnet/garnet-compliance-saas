const https = require('https');
const http = require('http');

// Test configuration
const API_BASE_URL = 'https://garnet-compliance-saas-production.up.railway.app';
const VENDOR_UUID = 'f18eec97-86e9-44c4-80b7-c86461f3efbe';
const VENDOR_ID = 11; // From database test

async function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Trust-Portal-Test/1.0'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
            rawData: responseData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: responseData,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testTrustPortalAPIs() {
  console.log('🔍 TESTING TRUST PORTAL API ENDPOINTS\n');
  console.log('='.repeat(60));
  
  const tests = [
    {
      name: 'Test Trust Portal Vendors List',
      url: `${API_BASE_URL}/api/trust-portal/vendors`,
      description: 'Check if vendors are listed in trust portal'
    },
    {
      name: 'Test Trust Portal Items (General)',
      url: `${API_BASE_URL}/api/trust-portal/items`,
      description: 'Get all trust portal items'
    },
    {
      name: 'Test Trust Portal Vendor Data (by UUID)',
      url: `${API_BASE_URL}/api/trust-portal/vendor/${VENDOR_UUID}`,
      description: 'Get trust portal data for specific vendor using UUID'
    },
    {
      name: 'Test Trust Portal Vendor Data (by numeric ID)',
      url: `${API_BASE_URL}/api/trust-portal/vendor/${VENDOR_ID}`,
      description: 'Get trust portal data for specific vendor using numeric ID'
    },
    {
      name: 'Test Trust Portal Vendor Items',
      url: `${API_BASE_URL}/api/trust-portal/vendor/${VENDOR_UUID}/items`,
      description: 'Get items for specific vendor'
    },
    {
      name: 'Test Trust Portal Health Check',
      url: `${API_BASE_URL}/health`,
      description: 'Check if the API is healthy'
    }
  ];

  let successCount = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    console.log(`\n📋 ${test.name}`);
    console.log(`🔗 URL: ${test.url}`);
    console.log(`📝 ${test.description}`);
    console.log('-'.repeat(50));
    
    try {
      const result = await makeRequest(test.url);
      
      console.log(`📊 Status Code: ${result.statusCode}`);
      
      if (result.statusCode >= 200 && result.statusCode < 300) {
        console.log('✅ Request successful!');
        successCount++;
        
        if (result.data) {
          if (Array.isArray(result.data)) {
            console.log(`📈 Response: Array with ${result.data.length} items`);
            if (result.data.length > 0) {
              console.log('📄 Sample item:', JSON.stringify(result.data[0], null, 2).substring(0, 200) + '...');
            }
          } else if (typeof result.data === 'object') {
            console.log('📄 Response: Object');
            const keys = Object.keys(result.data);
            console.log(`📋 Keys: ${keys.join(', ')}`);
            if (keys.length > 0) {
              console.log('📄 Sample data:', JSON.stringify(result.data, null, 2).substring(0, 300) + '...');
            }
          } else {
            console.log(`📄 Response: ${result.data}`);
          }
        } else {
          console.log('📄 Response: Empty or null');
          if (result.rawData) {
            console.log('📄 Raw response:', result.rawData.substring(0, 200) + '...');
          }
        }
      } else if (result.statusCode === 404) {
        console.log('⚠️ Endpoint not found (404)');
        if (result.rawData) {
          console.log('📄 Error details:', result.rawData);
        }
      } else if (result.statusCode >= 400 && result.statusCode < 500) {
        console.log('❌ Client error');
        if (result.rawData) {
          console.log('📄 Error details:', result.rawData);
        }
      } else if (result.statusCode >= 500) {
        console.log('❌ Server error');
        if (result.rawData) {
          console.log('📄 Error details:', result.rawData);
        }
      }
      
    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - successCount}/${totalTests}`);
  
  if (successCount === totalTests) {
    console.log('\n🎉 All API tests passed!');
  } else if (successCount > 0) {
    console.log('\n⚠️ Some API endpoints are working, some need attention.');
  } else {
    console.log('\n❌ All API tests failed. Check your backend deployment.');
  }

  // Special analysis for trust portal issue
  console.log('\n🔍 TRUST PORTAL ISSUE ANALYSIS');
  console.log('='.repeat(60));
  console.log('Based on the database test results:');
  console.log(`• Vendor "${VENDOR_UUID}" exists in database (ID: ${VENDOR_ID})`);
  console.log('• 6 trust portal items exist for this vendor');
  console.log('• 2 supporting documents exist');
  console.log('\nIf trust portal pages show empty:');
  console.log('1. Check if the API endpoints above are working');
  console.log('2. Check if frontend is calling the correct endpoints');
  console.log('3. Check if there are CORS issues');
  console.log('4. Check if the UUID to ID conversion is working');
}

// Additional test for the specific trust portal frontend URLs
async function testFrontendTrustPortalUrls() {
  console.log('\n🌐 TESTING FRONTEND TRUST PORTAL URLS');
  console.log('='.repeat(60));
  
  const frontendUrls = [
    'https://www.garnetai.net/trust-portal/',
    `https://www.garnetai.net/trust-portal/vendor/?id=${VENDOR_UUID}`
  ];
  
  for (const url of frontendUrls) {
    console.log(`\n🔗 Testing: ${url}`);
    try {
      const result = await makeRequest(url);
      console.log(`📊 Status: ${result.statusCode}`);
      
      if (result.statusCode === 200) {
        console.log('✅ Frontend page loads successfully');
        // Check if it contains any references to API calls
        if (result.rawData && result.rawData.includes('trust-portal')) {
          console.log('📋 Page contains trust-portal references');
        }
      } else {
        console.log(`⚠️ Frontend page returned status ${result.statusCode}`);
      }
    } catch (error) {
      console.log('❌ Failed to load frontend page:', error.message);
    }
  }
}

// Run the tests
async function runAllTests() {
  try {
    await testTrustPortalAPIs();
    await testFrontendTrustPortalUrls();
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

runAllTests(); 