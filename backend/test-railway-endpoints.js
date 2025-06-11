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

async function runTests() {
  console.log('🚀 Testing Railway Backend Endpoints...\n');
  
  // Test basic endpoints
  await testEndpoint('/');
  await testEndpoint('/health');
  await testEndpoint('/ping');
  await testEndpoint('/test-simple');
  
  // Test questionnaire endpoints
  await testEndpoint('/api/questionnaires');
  await testEndpoint('/test-questionnaires');
  
  // Test creating a questionnaire
  const createData = {
    title: 'Test Security Assessment',
    questions: [
      'What encryption methods do you use?',
      'How do you handle data backups?',
      'What is your incident response plan?'
    ]
  };
  
  const createResult = await testEndpoint('/api/questionnaires', 'POST', createData);
  
  if (createResult.data && createResult.data.questionnaire) {
    const questionnaireId = createResult.data.questionnaire.id;
    console.log(`\n📋 Created questionnaire with ID: ${questionnaireId}`);
    
    // Test getting the created questionnaire
    await testEndpoint(`/api/questionnaires/${questionnaireId}`);
    
    // Clean up - delete the test questionnaire
    await testEndpoint(`/api/questionnaires/${questionnaireId}`, 'DELETE');
  }
  
  console.log('\n🎉 Testing completed!');
}

// Run the tests
runTests().catch(console.error); 