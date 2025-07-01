// CommonJS version of the test script
const fetch = require('node-fetch');

async function testGenerateDocument() {
  try {
    console.log('Testing generate-document API endpoint...');
    
    const response = await fetch('http://localhost:8080/api/ai/generate-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentTitle: 'Data Retention Policy',
        instructions: 'Create a basic data retention policy for a SaaS company',
        category: 'Data Privacy'
      })
    });
    
    const data = await response.json();
    
    console.log('API Response:');
    console.log('Success:', data.success);
    console.log('Title:', data.title);
    console.log('Content (first 200 chars):', data.content.substring(0, 200) + '...');
    
    return data;
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testGenerateDocument(); 