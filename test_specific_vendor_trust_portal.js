const https = require('https');

// Test configuration
const API_BASE_URL = 'https://garnet-compliance-saas-production.up.railway.app';
const VENDOR_UUID = 'f18eec97-86e9-44c4-80b7-c86461f3efbe';
const VENDOR_ID = 11;

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
        'Accept': 'application/json'
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

async function testVendorTrustPortalData() {
  console.log('🔍 TESTING SPECIFIC VENDOR TRUST PORTAL DATA\n');
  console.log('='.repeat(70));
  
  const url = `${API_BASE_URL}/api/trust-portal/vendor/${VENDOR_UUID}`;
  console.log(`📍 Testing URL: ${url}`);
  console.log(`🎯 Vendor UUID: ${VENDOR_UUID}`);
  console.log(`🆔 Expected Vendor ID: ${VENDOR_ID}`);
  
  try {
    const result = await makeRequest(url);
    
    console.log('\n📊 RESPONSE ANALYSIS:');
    console.log('='.repeat(70));
    console.log(`Status Code: ${result.status}`);
    
    if (result.status === 200 && result.data) {
      console.log('\n✅ SUCCESS - API returned data!');
      
      // Analyze the response structure
      console.log('\n📋 RESPONSE STRUCTURE:');
      const keys = Object.keys(result.data);
      console.log(`Available keys: ${keys.join(', ')}`);
      
      // Check each key
      keys.forEach(key => {
        const value = result.data[key];
        if (Array.isArray(value)) {
          console.log(`\n🔹 ${key}: Array with ${value.length} items`);
          if (value.length > 0) {
            console.log(`   Sample item:`, JSON.stringify(value[0], null, 2).substring(0, 200) + '...');
          } else {
            console.log(`   ⚠️ Array is empty!`);
          }
        } else if (typeof value === 'object' && value !== null) {
          console.log(`\n🔹 ${key}: Object`);
          console.log(`   Keys: ${Object.keys(value).join(', ')}`);
          console.log(`   Sample:`, JSON.stringify(value, null, 2).substring(0, 200) + '...');
        } else {
          console.log(`\n🔹 ${key}: ${typeof value} = ${value}`);
        }
      });
      
      // Specific checks for trust portal items
      if (result.data.trustPortalItems) {
        console.log('\n🏛️ TRUST PORTAL ITEMS ANALYSIS:');
        console.log('='.repeat(50));
        const items = result.data.trustPortalItems;
        console.log(`✅ Trust portal items found: ${items.length}`);
        
        if (items.length > 0) {
          items.forEach((item, index) => {
            console.log(`\n  Item ${index + 1}:`);
            console.log(`    📝 Title: ${item.title}`);
            console.log(`    📂 Category: ${item.category}`);
            console.log(`    📅 Created: ${item.createdAt}`);
            console.log(`    🆔 ID: ${item.id}`);
            if (item.description) {
              console.log(`    📄 Description: ${item.description.substring(0, 100)}...`);
            }
          });
        }
      } else {
        console.log('\n❌ MISSING: trustPortalItems key not found in response!');
        console.log('This means the backend is not including trust portal items in the response.');
      }
      
      // Check vendor data
      if (result.data.vendor) {
        console.log('\n👤 VENDOR DATA:');
        console.log(`✅ Vendor ID: ${result.data.vendor.vendorId}`);
        console.log(`✅ Company: ${result.data.vendor.companyName}`);
        console.log(`✅ Status: ${result.data.vendor.status}`);
      }
      
    } else {
      console.log(`\n❌ FAILED - Status: ${result.status}`);
      if (result.parseError) {
        console.log(`Raw response: ${result.data}`);
      } else {
        console.log(`Error data:`, JSON.stringify(result.data, null, 2));
      }
    }
    
  } catch (error) {
    console.log(`\n💥 REQUEST FAILED: ${error.message}`);
  }
}

// Also test the frontend trust portal page to see what it's trying to load
async function testFrontendBehavior() {
  console.log('\n\n🌐 TESTING FRONTEND TRUST PORTAL PAGE\n');
  console.log('='.repeat(70));
  
  const frontendUrl = `https://www.garnetai.net/trust-portal/vendor/?id=${VENDOR_UUID}`;
  console.log(`📍 Frontend URL: ${frontendUrl}`);
  
  try {
    const result = await makeRequest(frontendUrl);
    console.log(`📊 Status: ${result.status}`);
    
    if (result.status === 200) {
      console.log('✅ Frontend page loads successfully');
      
      // Check if the page content contains any API calls we can identify
      const content = result.data.toString();
      
      // Look for API endpoints in the page source
      const apiMatches = content.match(/\/api\/[^"'\s]+/g);
      if (apiMatches) {
        console.log('\n📡 API endpoints found in frontend:');
        const uniqueEndpoints = [...new Set(apiMatches)];
        uniqueEndpoints.forEach(endpoint => {
          console.log(`   ${endpoint}`);
        });
      }
      
      // Check for trust portal related code
      if (content.includes('trust-portal')) {
        console.log('\n✅ Page contains trust-portal references');
      }
      
      if (content.includes('trustPortalItems')) {
        console.log('✅ Page references trustPortalItems');
      }
      
      if (content.includes('No items found') || content.includes('empty')) {
        console.log('⚠️ Page might be showing empty state');
      }
      
    } else {
      console.log('❌ Frontend page failed to load');
    }
  } catch (error) {
    console.log(`💥 Frontend test failed: ${error.message}`);
  }
}

async function runTests() {
  await testVendorTrustPortalData();
  await testFrontendBehavior();
  
  console.log('\n\n🎯 DIAGNOSIS SUMMARY:');
  console.log('='.repeat(70));
  console.log('If trustPortalItems is missing from the API response:');
  console.log('1. ✅ Database has 6 trust portal items for this vendor');
  console.log('2. ✅ Backend service includes trustPortalItems in response');
  console.log('3. ❓ Check if there\'s a caching issue or deployment delay');
  console.log('4. ❓ Check if the backend needs to be redeployed');
  console.log('\nIf trustPortalItems is present but frontend shows empty:');
  console.log('1. ❓ Check frontend API call implementation');
  console.log('2. ❓ Check for JavaScript errors in browser console');
  console.log('3. ❓ Check CORS or authentication issues');
}

runTests().catch(console.error); 