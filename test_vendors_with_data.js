const https = require('https');

// Test getting all vendors with trust portal data
const testVendorsWithData = async () => {
  const url = 'https://garnet-compliance-saas-production.up.railway.app/api/trust-portal/vendors';
  
  console.log('🔍 Checking vendors with trust portal data...');
  console.log('URL:', url);
  console.log('---');
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Response Status:', res.statusCode);
          console.log('📊 Vendors with trust portal data:');
          
          if (response.success && response.data && response.data.length > 0) {
            console.log('Found', response.data.length, 'vendors:');
            response.data.forEach((vendor, index) => {
              console.log(`  ${index + 1}. ${vendor.companyName} (ID: ${vendor.vendorId})`);
            });
          } else if (response.vendors && response.vendors.length > 0) {
            console.log('Found', response.vendors.length, 'vendors:');
            response.vendors.forEach((vendor, index) => {
              console.log(`  ${index + 1}. ${vendor.companyName} (ID: ${vendor.vendorId})`);
            });
          } else {
            console.log('No vendors found with trust portal data');
            console.log('Response:', JSON.stringify(response, null, 2));
          }
          
          resolve(response);
        } catch (error) {
          console.error('❌ Error parsing response:', error);
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

testVendorsWithData()
  .then(() => console.log('✅ Test completed'))
  .catch((error) => console.error('❌ Test failed:', error)); 