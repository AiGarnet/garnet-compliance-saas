const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3000'; // Update with your actual base URL
const API_ENDPOINT = `${BASE_URL}/api/documents/validate`;

// Test data
const testCases = [
  {
    name: 'High Confidence Document Question',
    questionText: 'Please upload your business license certificate',
    expectedConfidence: 0.9,
    expectedRequiresDoc: true
  },
  {
    name: 'Medium Confidence Document Question', 
    questionText: 'Provide proof of insurance coverage',
    expectedConfidence: 0.7,
    expectedRequiresDoc: true
  },
  {
    name: 'Low Confidence Document Question',
    questionText: 'Submit a copy of your records',
    expectedConfidence: 0.5,
    expectedRequiresDoc: true
  },
  {
    name: 'No Document Required',
    questionText: 'What is your company name?',
    expectedConfidence: 0.2,
    expectedRequiresDoc: false
  },
  {
    name: 'Complex Document Question',
    questionText: 'Attach your tax identification document and business registration',
    expectedConfidence: 0.9,
    expectedRequiresDoc: true
  }
];

// Test files content
const testDocuments = {
  businessLicense: {
    filename: 'business_license.txt',
    content: `BUSINESS LICENSE CERTIFICATE
    
Company Name: TechCorp Solutions
License Number: BL-2024-001234
Issue Date: January 1, 2024
Expiry Date: December 31, 2024
Business Type: Technology Services
Address: 123 Tech Street, Innovation City

This certificate authorizes the above business to operate legally 
within the jurisdiction. All applicable fees have been paid.

Signed by: Business Registration Authority`
  },
  
  irrelevantDoc: {
    filename: 'employee_handbook.txt', 
    content: `EMPLOYEE HANDBOOK
    
1. Work Schedule
Employees are expected to work 40 hours per week.
Core hours are 9 AM to 5 PM.

2. Dress Code
Business casual attire is required.

3. Vacation Policy
Employees accrue 2 weeks of vacation annually.

4. Benefits
Health insurance is provided after 90 days of employment.`
  },

  insuranceProof: {
    filename: 'insurance_certificate.txt',
    content: `CERTIFICATE OF INSURANCE

Policy Holder: TechCorp Solutions  
Policy Number: INS-789456123
Coverage Type: General Liability Insurance
Coverage Amount: $2,000,000
Effective Date: January 1, 2024
Expiration Date: January 1, 2025

This certificate provides proof of insurance coverage
for the named insured party.

Issued by: SafeGuard Insurance Company`
  }
};

// Utility functions
function detectDocumentRequirementBasic(questionText) {
  const text = questionText.toLowerCase();
  
  // High confidence keywords
  const highConfidenceKeywords = ['upload', 'provide document', 'attach', 'certificate', 'license'];
  const mediumConfidenceKeywords = ['provide', 'submit', 'proof', 'evidence', 'documentation'];
  const lowConfidenceKeywords = ['copy', 'scan', 'file', 'record'];
  
  for (const keyword of highConfidenceKeywords) {
    if (text.includes(keyword)) {
      return {
        requiresDocument: true,
        confidenceScore: 0.9,
        reason: `High confidence - contains keyword: "${keyword}"`
      };
    }
  }
  
  for (const keyword of mediumConfidenceKeywords) {
    if (text.includes(keyword)) {
      return {
        requiresDocument: true,
        confidenceScore: 0.7,
        reason: `Medium confidence - contains keyword: "${keyword}"`
      };
    }
  }
  
  for (const keyword of lowConfidenceKeywords) {
    if (text.includes(keyword)) {
      return {
        requiresDocument: true,
        confidenceScore: 0.5,
        reason: `Low confidence - contains keyword: "${keyword}"`
      };
    }
  }
  
  return {
    requiresDocument: false,
    confidenceScore: 0.2,
    reason: 'No document-related keywords detected'
  };
}

function createTestFile(document) {
  const filename = `test_${document.filename}`;
  fs.writeFileSync(filename, document.content);
  return filename;
}

function cleanupTestFiles() {
  Object.values(testDocuments).forEach(doc => {
    const filename = `test_${doc.filename}`;
    try {
      fs.unlinkSync(filename);
    } catch (error) {
      // File might not exist, ignore
    }
  });
}

async function testDocumentDetection() {
  console.log('🧪 Testing Document Requirement Detection Logic...\n');
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  for (const testCase of testCases) {
    const result = detectDocumentRequirementBasic(testCase.questionText);
    
    console.log(`📝 Test: ${testCase.name}`);
    console.log(`   Question: "${testCase.questionText}"`);
    console.log(`   Expected: Requires Doc: ${testCase.expectedRequiresDoc}, Confidence: ${testCase.expectedConfidence}`);
    console.log(`   Actual:   Requires Doc: ${result.requiresDocument}, Confidence: ${result.confidenceScore}`);
    console.log(`   Reason:   ${result.reason}`);
    
    const passed = result.requiresDocument === testCase.expectedRequiresDoc && 
                   result.confidenceScore === testCase.expectedConfidence;
    
    if (passed) {
      console.log('   ✅ PASSED\n');
      passedTests++;
    } else {
      console.log('   ❌ FAILED\n');
    }
  }
  
  console.log(`📊 Document Detection Results: ${passedTests}/${totalTests} tests passed\n`);
  return passedTests === totalTests;
}

async function testRelevanceAPI() {
  console.log('🌐 Testing Document Relevance API...\n');
  
  // Test cases for API
  const apiTestCases = [
    {
      questionText: 'Please upload your business license',
      document: testDocuments.businessLicense,
      expectedRelevant: true,
      description: 'Business license question with relevant document'
    },
    {
      questionText: 'Please upload your business license', 
      document: testDocuments.irrelevantDoc,
      expectedRelevant: false,
      description: 'Business license question with irrelevant document'
    },
    {
      questionText: 'Provide proof of insurance coverage',
      document: testDocuments.insuranceProof,
      expectedRelevant: true,
      description: 'Insurance question with relevant document'
    }
  ];
  
  let apiPassedTests = 0;
  let apiTotalTests = apiTestCases.length;
  
  for (const testCase of apiTestCases) {
    try {
      console.log(`🔍 Testing: ${testCase.description}`);
      
      // Create test file
      const filename = createTestFile(testCase.document);
      
      // Create form data
      const formData = new FormData();
      formData.append('questionId', 'test-question-id'); // Mock question ID
      formData.append('file', fs.createReadStream(filename));
      
      // Make API request
      console.log(`   Making request to: ${API_ENDPOINT}`);
      const response = await axios.post(API_ENDPOINT, formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Type': 'multipart/form-data'
        },
        timeout: 10000
      });
      
      const result = response.data;
      console.log(`   Response: Relevance Score: ${result.relevanceScore}, Is Relevant: ${result.isRelevant}`);
      console.log(`   Message: ${result.message}`);
      
      const passed = result.isRelevant === testCase.expectedRelevant;
      
      if (passed) {
        console.log('   ✅ API TEST PASSED\n');
        apiPassedTests++;
      } else {
        console.log('   ❌ API TEST FAILED\n');
      }
      
      // Cleanup test file
      fs.unlinkSync(filename);
      
    } catch (error) {
      console.log(`   ❌ API TEST ERROR: ${error.message}\n`);
      
      if (error.response) {
        console.log(`   Response status: ${error.response.status}`);
        console.log(`   Response data:`, error.response.data);
      }
    }
  }
  
  console.log(`📊 API Test Results: ${apiPassedTests}/${apiTotalTests} tests passed\n`);
  return apiPassedTests === apiTotalTests;
}

async function testEndpointHealth() {
  console.log('🏥 Testing API Endpoint Health...\n');
  
  try {
    // Test if the server is running
    const healthResponse = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ Server is running and accessible');
    console.log(`   Health status: ${healthResponse.status}`);
    return true;
  } catch (error) {
    console.log('❌ Server health check failed');
    console.log(`   Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   💡 Make sure your NestJS server is running on the correct port');
    }
    
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Document Checker Comprehensive Tests...\n');
  console.log('='*60);
  
  try {
    // Test 1: Document Detection Logic
    const detectionPassed = await testDocumentDetection();
    
    // Test 2: API Endpoint Health
    const healthPassed = await testEndpointHealth();
    
    // Test 3: Document Relevance API (only if server is healthy)
    let apiPassed = false;
    if (healthPassed) {
      apiPassed = await testRelevanceAPI();
    } else {
      console.log('⚠️  Skipping API tests due to server connectivity issues\n');
    }
    
    // Final Results
    console.log('='*60);
    console.log('📋 FINAL TEST RESULTS:');
    console.log(`   Document Detection Logic: ${detectionPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   API Endpoint Health:      ${healthPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Document Relevance API:   ${apiPassed ? '✅ PASSED' : '⚠️  SKIPPED/FAILED'}`);
    
    const allPassed = detectionPassed && healthPassed && apiPassed;
    console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}`);
    
    if (!allPassed) {
      console.log('\n💡 Troubleshooting Tips:');
      if (!detectionPassed) {
        console.log('   - Review keyword detection logic in ChecklistsService');
      }
      if (!healthPassed) {
        console.log('   - Ensure your NestJS server is running: npm run start:dev');
        console.log('   - Check if the port matches your application configuration');
      }
      if (!apiPassed && healthPassed) {
        console.log('   - Verify the documents module is properly configured');
        console.log('   - Check database connectivity and question table');
        console.log('   - Ensure all required dependencies are installed');
      }
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  } finally {
    // Cleanup any remaining test files
    cleanupTestFiles();
  }
}

// Run all tests
runAllTests().catch(console.error);