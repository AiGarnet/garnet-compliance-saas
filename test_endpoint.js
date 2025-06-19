const https = require('https');

console.log('Testing vendors endpoint...');

const url = 'https://garnet-compliance-saas-production.up.railway.app/api/vendors';

https.get(url, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Status Message:', res.statusMessage);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Body:', data);
    
    if (res.statusCode === 404) {
      console.log('\n❌ 404 Error - Endpoint not found');
    } else if (res.statusCode === 401) {
      console.log('\n❌ 401 Error - Authentication required');
    } else if (res.statusCode === 200) {
      console.log('\n✅ Success - Endpoint is working');
      try {
        const json = JSON.parse(data);
        console.log('Parsed JSON:', json);
      } catch (e) {
        console.log('Response is not valid JSON');
      }
    }
  });
}).on('error', (err) => {
  console.error('❌ Request Error:', err.message);
}); 