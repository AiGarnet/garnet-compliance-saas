const http = require('http');

const testData = {
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'Developer',
  organization: 'Test Corp'
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/join-waitlist',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing waitlist API...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Body:', data);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
  process.exit(1);
});

req.write(postData);
req.end();

// Timeout after 10 seconds
setTimeout(() => {
  console.log('Test timed out');
  process.exit(1);
}, 10000); 