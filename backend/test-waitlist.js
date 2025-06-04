const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function testAPI(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`${method} ${endpoint}:`);
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(result, null, 2));
    console.log('');
    
    return { status: response.status, data: result };
  } catch (error) {
    console.error(`Error testing ${endpoint}:`, error.message);
    return { error: error.message };
  }
}

async function runWaitlistTests() {
  console.log('Testing new waitlist API endpoints...\n');

  try {
    // Test server status
    console.log('=== Testing Server Status ===');
    await testAPI('/api/status');

    // Test waitlist stats (should be empty initially)
    console.log('=== Testing Waitlist Stats (Initial) ===');
    await testAPI('/api/waitlist/stats');

    // Test waitlist entries (should be empty initially)
    console.log('=== Testing Waitlist Entries (Initial) ===');
    await testAPI('/api/waitlist/users');

    // Test adding to waitlist
    console.log('=== Testing Join Waitlist ===');
    const testEntry = {
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'CISO',
      organization: 'Test Corp'
    };
    await testAPI('/join-waitlist', 'POST', testEntry);

    // Test adding another entry
    console.log('=== Testing Join Waitlist (Second Entry) ===');
    const testEntry2 = {
      email: 'jane@example.com',
      full_name: 'Jane Smith',
      role: 'Security Manager',
      organization: 'Security Inc'
    };
    await testAPI('/join-waitlist', 'POST', testEntry2);

    // Test duplicate email
    console.log('=== Testing Duplicate Email ===');
    await testAPI('/join-waitlist', 'POST', testEntry);

    // Test stats again to see if count increased
    console.log('=== Testing Waitlist Stats After Signups ===');
    await testAPI('/api/waitlist/stats');

    // Test getting all entries
    console.log('=== Testing Waitlist Entries After Signups ===');
    await testAPI('/api/waitlist/users');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

runWaitlistTests(); 