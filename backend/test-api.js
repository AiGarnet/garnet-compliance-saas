const http = require('http');

function testAPI(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          console.log(`${method} ${path} - Status: ${res.statusCode}`);
          console.log('Response:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (e) {
          console.log(`${method} ${path} - Status: ${res.statusCode}`);
          console.log('Raw response:', body);
          resolve(body);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`${method} ${path} - Error:`, e.message);
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('Testing backend API endpoints...\n');

  try {
    // Test server status
    console.log('=== Testing Server Status ===');
    await testAPI('/api/status');
    console.log('');

    // Test waitlist stats
    console.log('=== Testing Waitlist Stats ===');
    await testAPI('/api/waitlist/stats');
    console.log('');

    // Test waitlist users
    console.log('=== Testing Waitlist Users ===');
    await testAPI('/api/waitlist/users');
    console.log('');

    // Test waitlist signup with new user
    console.log('=== Testing Waitlist Signup ===');
    const testUser = {
      email: 'test@example.com',
      password: 'testpass123',
      full_name: 'Test User',
      role: 'CISO',
      organization: 'Test Corp'
    };
    await testAPI('/api/waitlist/signup', 'POST', testUser);
    console.log('');

    // Test stats again to see if count increased
    console.log('=== Testing Waitlist Stats After Signup ===');
    await testAPI('/api/waitlist/stats');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests(); 