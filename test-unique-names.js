const FormData = require('form-data');
const fs = require('fs');
const https = require('https');

console.log('🔄 Testing Unique Name Generation');
console.log('=================================');

const vendorUuid = 'f2ce7f2e-1c00-4107-b9dd-c785d45f7775';
const testFileName = 'duplicate-test.txt';
const testContent = 'Test checklist for duplicate name handling';

// Create test file
fs.writeFileSync(testFileName, testContent);

async function uploadChecklist(name, description) {
  console.log(`\n📋 ${description}`);
  console.log(`   Name: "${name}"`);
  
  const form = new FormData();
  form.append('file', fs.createReadStream(testFileName));
  form.append('vendorId', vendorUuid);
  form.append('name', name);
  
  const options = {
    hostname: 'garnet-compliance-saas-production.up.railway.app',
    port: 443,
    path: '/api/checklists/upload',
    method: 'POST',
    headers: form.getHeaders()
  };
  
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        if (res.statusCode === 201) {
          try {
            const result = JSON.parse(data);
            console.log(`   ✅ Success! Created: "${result.checklist.name}"`);
            console.log(`   📁 Checklist ID: ${result.checklist.id}`);
          } catch (e) {
            console.log(`   ✅ Success! (Could not parse response)`);
          }
        } else {
          try {
            const error = JSON.parse(data);
            console.log(`   ❌ Error: ${error.message || error.error || data}`);
          } catch (e) {
            console.log(`   ❌ Raw Error: ${data}`);
          }
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Request Error: ${error.message}`);
      resolve();
    });
    
    form.pipe(req);
  });
}

async function runTest() {
  try {
    // Test uploading the same name multiple times
    await uploadChecklist('Test Checklist', 'First upload (should work)');
    await uploadChecklist('Test Checklist', 'Second upload (should get renamed to "Test Checklist (1)")');
    await uploadChecklist('Test Checklist', 'Third upload (should get renamed to "Test Checklist (2)")');
    
    // Test with file extension
    await uploadChecklist('Security.pdf', 'First PDF upload');
    await uploadChecklist('Security.pdf', 'Second PDF upload (should become "Security (1).pdf")');
    
    console.log('\n🎯 Test Summary:');
    console.log('The backend should now automatically generate unique names');
    console.log('when there are conflicts, preventing the duplicate key error.');
    
  } finally {
    // Cleanup
    fs.unlinkSync(testFileName);
    console.log('\n🧹 Test file cleaned up');
  }
}

runTest(); 