const BASE_URL = 'https://garnet-compliance-saas-production.up.railway.app';

async function testEndpoint(path, method = 'GET', body = null) {
  try {
    console.log(`\n🧪 Testing: ${method} ${path}`);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.text();
    
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      parsedData = data;
    }
    
    if (response.ok) {
      console.log(`✅ ${response.status}: ${JSON.stringify(parsedData).substring(0, 200)}...`);
    } else {
      console.log(`❌ ${response.status}: ${JSON.stringify(parsedData)}`);
    }
    
    return { status: response.status, data: parsedData };
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
    return { error: error.message };
  }
}

async function runComprehensiveTests() {
  console.log('🚀 Testing ALL Railway Backend Endpoints...\n');
  
  // Test basic/root endpoints that should exist in both servers
  console.log('=== BASIC ENDPOINTS ===');
  await testEndpoint('/');
  await testEndpoint('/health');
  await testEndpoint('/ping');
  await testEndpoint('/railway-healthcheck');
  await testEndpoint('/version');
  
  // Test waitlist endpoints (from waitlist-server.js)
  console.log('\n=== WAITLIST ENDPOINTS ===');
  await testEndpoint('/join-waitlist', 'POST', {
    email: `test-${Date.now()}@example.com`,
    full_name: 'Test User',
    role: 'Developer',
    organization: 'Test Company'
  });
  await testEndpoint('/api/waitlist/stats');
  await testEndpoint('/api/waitlist/users');
  await testEndpoint('/api/auth/signup', 'POST', {
    email: `auth-test-${Date.now()}@example.com`,
    password: 'testpass123',
    full_name: 'Auth Test User',
    role: 'vendor',
    organization: 'Test Company'
  });
  
  // Test questionnaire endpoints (from TypeScript server)
  console.log('\n=== QUESTIONNAIRE ENDPOINTS ===');
  await testEndpoint('/api/questionnaires');
  await testEndpoint('/test-simple');
  await testEndpoint('/test-questionnaires');
  
  // Test AI endpoints
  console.log('\n=== AI ENDPOINTS ===');
  await testEndpoint('/ask', 'POST', {
    question: 'What are GDPR compliance requirements?'
  });
  await testEndpoint('/api/answer', 'POST', {
    question: 'What are GDPR compliance requirements?'
  });
  await testEndpoint('/api/generate-answers', 'POST', {
    questions: [
      'What encryption methods do you use?',
      'How do you handle data backups?'
    ]
  });
  
  // Test vendor endpoints
  console.log('\n=== VENDOR ENDPOINTS ===');
  await testEndpoint('/api/vendors');
  await testEndpoint('/api/vendors/stats');
  await testEndpoint('/api/vendors/with-suggestions');
  
  console.log('\n🎉 Comprehensive testing completed!');
}

// Run the tests
runComprehensiveTests().catch(console.error); 