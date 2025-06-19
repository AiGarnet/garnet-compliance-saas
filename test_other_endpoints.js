const https = require('https');

const endpoints = [
  '/',
  '/health',
  '/api/docs',
  '/api/vendors',
  '/api/auth/profile',
  '/api/waitlist/stats'
];

async function testEndpoint(path) {
  return new Promise((resolve) => {
    const url = `https://garnet-compliance-saas-production.up.railway.app${path}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          message: res.statusMessage,
          body: data.substring(0, 200) // First 200 chars
        });
      });
    }).on('error', (err) => {
      resolve({
        path,
        status: 'ERROR',
        message: err.message,
        body: ''
      });
    });
  });
}

async function testAllEndpoints() {
  console.log('Testing API endpoints...\n');
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    const status = result.status === 200 ? '✅' : result.status === 404 ? '❌' : '⚠️';
    console.log(`${status} ${result.path}: ${result.status} ${result.message}`);
    if (result.body && result.status !== 'ERROR') {
      console.log(`   Body: ${result.body}...`);
    }
    console.log('');
  }
}

testAllEndpoints(); 