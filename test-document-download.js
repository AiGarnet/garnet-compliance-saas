const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  accessKeyId: process.env.DO_SPACE_ACCESS_KEY || 'your_access_key_here',
  secretAccessKey: process.env.DO_SPACE_SECRET_KEY || 'your_secret_key_here',
  region: process.env.DO_SPACE_REGION || 'ams3',
  bucket: process.env.DO_SPACE_NAME || 'vendor-onboarding',
  endpoint: process.env.DO_SPACE_ENDPOINT || 'https://ams3.digitaloceanspaces.com',
  folders: {
    supportingDocs: 'supporting-docs/'
  }
};

// Create S3 client
const s3Client = new S3Client({
  endpoint: config.endpoint,
  region: config.region,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
  forcePathStyle: false, // DigitalOcean Spaces uses virtual-hosted-style URLs
});

// Test file creation
async function createTestFile() {
  console.log('Creating test file...');
  const testContent = 'This is a test document for supporting documents functionality.';
  fs.writeFileSync('test-document.txt', testContent);
  console.log('Test file created.');
}

// Upload test file
async function uploadTestFile() {
  console.log('Uploading test file to DigitalOcean Spaces...');
  
  const fileContent = fs.readFileSync('test-document.txt');
  const key = `${config.folders.supportingDocs}test-document-${Date.now()}.txt`;
  
  try {
    console.log(`Using bucket: ${config.bucket}, key: ${key}`);
    
    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: fileContent,
      ContentType: 'text/plain',
      ACL: 'public-read',
      Metadata: {
        vendorId: 'test-vendor',
        questionId: 'test-question',
        originalFilename: 'test-document.txt',
        uploadType: 'supporting-document'
      }
    });

    await s3Client.send(command);
    console.log('Test file uploaded successfully.');
    
    return key;
  } catch (error) {
    console.error('Error uploading test file:', error.message);
    throw error;
  }
}

// Generate signed URL
async function generateSignedUrl(key) {
  console.log(`Generating signed URL for key: ${key}`);
  
  try {
    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: key
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600
    });

    console.log('Signed URL generated successfully:', signedUrl);
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error.message);
    throw error;
  }
}

// Main test function
async function runTest() {
  try {
    console.log('Starting document download test...');
    console.log('Configuration:', {
      region: config.region,
      bucket: config.bucket,
      endpoint: config.endpoint,
      folders: config.folders
    });
    
    await createTestFile();
    const key = await uploadTestFile();
    const signedUrl = await generateSignedUrl(key);
    
    console.log('\nTest Results:');
    console.log('-------------');
    console.log('File Key:', key);
    console.log('Signed URL:', signedUrl);
    console.log('Direct URL:', `https://${config.bucket}.${config.endpoint.replace('https://', '')}/${key}`);
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
runTest(); 