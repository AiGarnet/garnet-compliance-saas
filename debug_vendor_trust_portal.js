const https = require('https');

// Test the specific vendor UUID that's causing the 500 error
const testVendorUUID = async () => {
  const vendorId = 'f18eec97-86e9-44c4-80b7-c86461f3efbe';
  const url = `https://garnet-compliance-saas-production.up.railway.app/api/trust-portal/vendor/${vendorId}`;
  
  console.log('🔍 Testing Vendor Trust Portal API with UUID...');
  console.log('URL:', url);
  console.log('Vendor ID:', vendorId);
  console.log('---');
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ Response Status:', res.statusCode);
        console.log('✅ Response Headers:', res.headers);
        console.log('---');
        
        try {
          const response = JSON.parse(data);
          console.log('📊 Response Data:');
          console.log(JSON.stringify(response, null, 2));
          
          if (res.statusCode === 500) {
            console.log('❌ 500 Internal Server Error Details:');
            console.log('- Error Message:', response.message || response.error);
            console.log('- Timestamp:', response.timestamp);
            console.log('- Path:', response.path);
            console.log('- Method:', response.method);
          } else if (res.statusCode === 404) {
            console.log('❌ 404 Not Found - Vendor not found');
          } else if (res.statusCode === 200) {
            console.log('✅ Success - Vendor trust portal data retrieved');
            console.log('- Vendor:', response.vendor ? response.vendor.companyName : 'Not found');
            console.log('- Checklists:', response.checklists ? response.checklists.length : 0);
            console.log('- Documents:', response.documents ? response.documents.length : 0);
          }
          
          resolve(response);
        } catch (error) {
          console.error('❌ Error parsing JSON response:', error);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error('❌ Request failed:', error);
      reject(error);
    });
  });
};

// Also test if we can find the vendor by checking all vendors
const testVendorExists = async () => {
  console.log('\n🔍 Testing if vendor exists in system...');
  
  // Test with a simple health check first
  const healthUrl = 'https://garnet-compliance-saas-production.up.railway.app/health';
  
  return new Promise((resolve, reject) => {
    https.get(healthUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('🏥 Health Check Status:', res.statusCode);
        try {
          const response = JSON.parse(data);
          console.log('📊 Backend Health:', response.status);
          console.log('📊 Database:', response.database ? 'Connected' : 'Not connected');
          resolve(response);
        } catch (error) {
          console.log('Raw health response:', data);
          resolve(data);
        }
      });
    }).on('error', (error) => {
      console.error('❌ Health check failed:', error);
      reject(error);
    });
  });
};

// Run the tests
async function runTests() {
  try {
    await testVendorExists();
    await testVendorUUID();
    
    console.log('\n🎯 Debugging Summary:');
    console.log('1. Check backend logs in Railway dashboard for detailed error info');
    console.log('2. Verify vendor UUID exists in database');
    console.log('3. Check if there are any issues with the new trust portal data queries');
    console.log('4. Consider adding more error logging to the backend');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

runTests(); 