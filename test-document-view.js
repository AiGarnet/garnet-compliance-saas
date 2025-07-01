const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Configuration
const config = {
  apiBaseUrl: 'http://localhost:8080',
  vendorId: '00000000-0000-0000-0000-000000000001', // Replace with a valid vendor ID
  questionId: 'standalone-1751267519965', // Use a standalone question ID format
  testFilePath: './test-document.txt'
};

// Create test file
function createTestFile() {
  console.log('Creating test file...');
  const testContent = 'This is a test document for supporting documents functionality.';
  fs.writeFileSync(config.testFilePath, testContent);
  console.log('Test file created.');
}

// Upload document
async function uploadDocument() {
  console.log('Uploading document...');
  
  const formData = new FormData();
  formData.append('file', fs.createReadStream(config.testFilePath));
  
  try {
    const response = await axios.post(
      `${config.apiBaseUrl}/api/checklists/questions/${config.questionId}/documents/vendor/${config.vendorId}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        }
      }
    );
    
    console.log('Document uploaded successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading document:', error.response?.data || error.message);
    throw error;
  }
}

// View document
async function viewDocument(documentId) {
  console.log(`Attempting to view document with ID: ${documentId}`);
  
  try {
    // First, get the document URL
    const response = await axios.get(
      `${config.apiBaseUrl}/api/checklists/documents/${documentId}/download`,
      { maxRedirects: 0, validateStatus: status => status >= 200 && status < 400 }
    );
    
    if (response.status === 302) {
      console.log('Redirect URL:', response.headers.location);
      return response.headers.location;
    } else {
      console.log('Document data:', response.data);
      return null;
    }
  } catch (error) {
    console.error('Error viewing document:', error.response?.data || error.message);
    throw error;
  }
}

// List documents
async function listDocuments() {
  console.log('Listing documents...');
  
  try {
    const response = await axios.get(
      `${config.apiBaseUrl}/api/checklists/vendor/${config.vendorId}/documents`
    );
    
    console.log('Documents:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error listing documents:', error.response?.data || error.message);
    throw error;
  }
}

// Main test function
async function runTest() {
  try {
    console.log('Starting document view test...');
    
    // Create test file
    createTestFile();
    
    // Upload document
    const uploadedDoc = await uploadDocument();
    console.log('\nUploaded document ID:', uploadedDoc.id);
    
    // List documents
    const documents = await listDocuments();
    console.log('\nFound', documents.length, 'documents');
    
    // View document
    if (uploadedDoc && uploadedDoc.id) {
      const documentUrl = await viewDocument(uploadedDoc.id);
      
      console.log('\nTest Results:');
      console.log('-------------');
      console.log('Document ID:', uploadedDoc.id);
      console.log('Document URL:', documentUrl || 'No URL returned');
      console.log('\nTest completed!');
    }
  } catch (error) {
    console.error('\nTest failed:', error.message);
  }
}

// Run the test
runTest(); 