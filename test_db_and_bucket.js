const { Client } = require('pg');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Database configuration
const DB_CONFIG = {
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: { rejectUnauthorized: false }
};

// DigitalOcean Spaces configuration (using correct env variable names from backend config)
const SPACES_CONFIG = {
  endpoint: process.env.DO_SPACE_ENDPOINT || 'https://ams3.digitaloceanspaces.com',
  accessKeyId: process.env.DO_SPACE_ACCESS_KEY || 'YOUR_DO_SPACE_ACCESS_KEY',
  secretAccessKey: process.env.DO_SPACE_SECRET_KEY || 'YOUR_DO_SPACE_SECRET_KEY',
  region: process.env.DO_SPACE_REGION || 'ams3',
  bucket: process.env.DO_SPACE_NAME || 'vendor-onboarding'
};

// Configure AWS SDK for DigitalOcean Spaces
const spacesEndpoint = new AWS.Endpoint(SPACES_CONFIG.endpoint);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: SPACES_CONFIG.accessKeyId,
  secretAccessKey: SPACES_CONFIG.secretAccessKey,
  region: SPACES_CONFIG.region
});

async function testDatabase() {
  console.log('🔍 TESTING DATABASE CONNECTION...\n');
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log('✅ Database connection successful!');

    // Test 1: Check basic table structure
    console.log('\n📋 1. Checking table structure...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log(`Found ${tables.rows.length} tables:`, tables.rows.map(r => r.table_name).join(', '));

    // Test 2: Check vendors table
    console.log('\n👥 2. Checking vendors table...');
    const vendors = await client.query(`
      SELECT vendor_id, uuid, company_name, created_at 
      FROM vendors 
      ORDER BY created_at DESC 
      LIMIT 5;
    `);
    console.log(`Found ${vendors.rows.length} vendors:`);
    vendors.rows.forEach((vendor, index) => {
      console.log(`  ${index + 1}. ${vendor.company_name} (ID: ${vendor.vendor_id}, UUID: ${vendor.uuid})`);
    });

    // Test 3: Check specific vendor
    console.log('\n🎯 3. Checking specific vendor f18eec97-86e9-44c4-80b7-c86461f3efbe...');
    const specificVendor = await client.query(`
      SELECT vendor_id, uuid, company_name 
      FROM vendors 
      WHERE uuid = 'f18eec97-86e9-44c4-80b7-c86461f3efbe';
    `);
    if (specificVendor.rows.length > 0) {
      console.log('✅ Vendor found:', specificVendor.rows[0]);
    } else {
      console.log('❌ Vendor not found!');
    }

    // Test 4: Check trust portal items
    console.log('\n🏛️ 4. Checking trust portal items...');
    const trustPortalItems = await client.query(`
      SELECT id, vendor_id, title, category, is_questionnaire_answer, created_at 
      FROM trust_portal_items 
      ORDER BY created_at DESC 
      LIMIT 10;
    `);
    console.log(`Found ${trustPortalItems.rows.length} trust portal items:`);
    trustPortalItems.rows.forEach((item, index) => {
      console.log(`  ${index + 1}. "${item.title}" (Vendor: ${item.vendor_id}, Category: ${item.category}) - ${item.created_at}`);
    });

    // Test 5: Check supporting documents
    console.log('\n📄 5. Checking supporting documents...');
    const supportingDocs = await client.query(`
      SELECT id, vendor_id, filename, file_type, uploaded_at, spaces_url 
      FROM checklist_supporting_documents 
      ORDER BY uploaded_at DESC 
      LIMIT 10;
    `);
    console.log(`Found ${supportingDocs.rows.length} supporting documents:`);
    supportingDocs.rows.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.filename} (Vendor: ${doc.vendor_id}) - ${doc.uploaded_at}`);
      if (doc.spaces_url) {
        console.log(`      URL: ${doc.spaces_url}`);
      }
    });

    // Test 6: Check checklists
    console.log('\n📋 6. Checking checklists...');
    const checklists = await client.query(`
      SELECT id, vendor_id, name, extraction_status, created_at 
      FROM checklists 
      ORDER BY created_at DESC 
      LIMIT 5;
    `);
    console.log(`Found ${checklists.rows.length} checklists:`);
    checklists.rows.forEach((checklist, index) => {
      console.log(`  ${index + 1}. ${checklist.name} (Vendor: ${checklist.vendor_id}, Status: ${checklist.extraction_status}) - ${checklist.created_at}`);
    });

    // Test 7: Check checklist questions
    console.log('\n❓ 7. Checking checklist questions...');
    const questions = await client.query(`
      SELECT id, checklist_id, vendor_id, question_text, status, ai_answer IS NOT NULL as has_answer
      FROM checklist_questions 
      ORDER BY created_at DESC 
      LIMIT 5;
    `);
    console.log(`Found ${questions.rows.length} questions:`);
    questions.rows.forEach((question, index) => {
      console.log(`  ${index + 1}. "${question.question_text.substring(0, 80)}..." (Status: ${question.status}, Has Answer: ${question.has_answer})`);
    });

    console.log('\n✅ Database tests completed successfully!');

  } catch (error) {
    console.error('❌ Database error:', error.message);
    return false;
  } finally {
    await client.end();
  }
  
  return true;
}

async function testBucket() {
  console.log('\n🪣 TESTING DIGITALOCEAN SPACES BUCKET...\n');
  
  try {
    // Test 1: List buckets
    console.log('1. Testing bucket access...');
    const buckets = await s3.listBuckets().promise();
    console.log('✅ Bucket access successful!');
    console.log(`Found ${buckets.Buckets.length} buckets:`, buckets.Buckets.map(b => b.Name).join(', '));

    // Test 2: List objects in the bucket
    console.log('\n2. Testing object listing...');
    const objects = await s3.listObjectsV2({
      Bucket: SPACES_CONFIG.bucket,
      MaxKeys: 20
    }).promise();
    console.log(`✅ Found ${objects.Contents.length} objects in bucket "${SPACES_CONFIG.bucket}"`);
    
    // Group objects by folder
    const folders = {};
    objects.Contents.forEach(obj => {
      const folder = obj.Key.split('/')[0];
      if (!folders[folder]) folders[folder] = [];
      folders[folder].push(obj);
    });

    Object.keys(folders).forEach(folder => {
      console.log(`  📁 ${folder}/ (${folders[folder].length} files)`);
      folders[folder].slice(0, 3).forEach(file => {
        console.log(`    - ${file.Key} (${(file.Size / 1024).toFixed(1)} KB) - ${file.LastModified}`);
      });
      if (folders[folder].length > 3) {
        console.log(`    ... and ${folders[folder].length - 3} more files`);
      }
    });

    // Test 3: Test upload (create a small test file)
    console.log('\n3. Testing file upload...');
    const testFileName = `test-files/connectivity-test-${Date.now()}.txt`;
    const testContent = `Connectivity test performed at ${new Date().toISOString()}\nDatabase: Connected\nBucket: Connected`;
    
    const uploadResult = await s3.upload({
      Bucket: SPACES_CONFIG.bucket,
      Key: testFileName,
      Body: testContent,
      ContentType: 'text/plain',
      ACL: 'private'
    }).promise();
    
    console.log('✅ Test file uploaded successfully!');
    console.log(`Location: ${uploadResult.Location}`);

    // Test 4: Test download
    console.log('\n4. Testing file download...');
    const downloadResult = await s3.getObject({
      Bucket: SPACES_CONFIG.bucket,
      Key: testFileName
    }).promise();
    
    const downloadedContent = downloadResult.Body.toString();
    console.log('✅ Test file downloaded successfully!');
    console.log('Downloaded content preview:', downloadedContent.substring(0, 100) + '...');

    // Test 5: Test delete
    console.log('\n5. Testing file deletion...');
    await s3.deleteObject({
      Bucket: SPACES_CONFIG.bucket,
      Key: testFileName
    }).promise();
    console.log('✅ Test file deleted successfully!');

    // Test 6: Check for specific vendor files
    console.log('\n6. Checking for vendor-specific files...');
    const vendorFiles = await s3.listObjectsV2({
      Bucket: SPACES_CONFIG.bucket,
      Prefix: 'f18eec97-86e9-44c4-80b7-c86461f3efbe/',
      MaxKeys: 10
    }).promise();
    
    if (vendorFiles.Contents.length > 0) {
      console.log(`✅ Found ${vendorFiles.Contents.length} files for vendor f18eec97-86e9-44c4-80b7-c86461f3efbe:`);
      vendorFiles.Contents.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.Key} (${(file.Size / 1024).toFixed(1)} KB) - ${file.LastModified}`);
      });
    } else {
      console.log('ℹ️ No files found for vendor f18eec97-86e9-44c4-80b7-c86461f3efbe');
    }

    console.log('\n✅ Bucket tests completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Bucket error:', error.message);
    if (error.code === 'CredentialsError') {
      console.error('💡 Tip: Check your DigitalOcean Spaces credentials in environment variables');
    }
    return false;
  }
}

async function checkEnvironmentVariables() {
  console.log('\n⚙️ CHECKING ENVIRONMENT VARIABLES...\n');
  
  const requiredVars = [
    'DO_SPACE_ACCESS_KEY',
    'DO_SPACE_SECRET_KEY', 
    'DO_SPACE_NAME',
    'DO_SPACE_REGION',
    'DO_SPACE_ENDPOINT'
  ];
  
  const envVars = {};
  requiredVars.forEach(varName => {
    envVars[varName] = process.env[varName] ? '✅ Set' : '❌ Missing';
  });
  
  console.log('Environment variables status:');
  Object.entries(envVars).forEach(([key, status]) => {
    console.log(`  ${key}: ${status}`);
  });
  
  if (Object.values(envVars).some(status => status.includes('❌'))) {
    console.log('\n💡 To set environment variables, create a .env file with:');
    console.log('DO_SPACE_ACCESS_KEY=your_spaces_access_key');
    console.log('DO_SPACE_SECRET_KEY=your_spaces_secret_key');
    console.log('DO_SPACE_NAME=your_bucket_name');
    console.log('DO_SPACE_REGION=ams3');
    console.log('DO_SPACE_ENDPOINT=https://ams3.digitaloceanspaces.com');
    return false;
  }
  
  return true;
}

async function runTests() {
  console.log('🚀 GARNET AI - DATABASE & BUCKET CONNECTIVITY TEST\n');
  console.log('='.repeat(60));
  
  let dbSuccess = false;
  let bucketSuccess = false;
  let envSuccess = false;
  
  try {
    // Check environment variables first
    envSuccess = await checkEnvironmentVariables();
    
    // Test database
    dbSuccess = await testDatabase();
    
    // Test bucket (only if env vars are set)
    if (envSuccess) {
      bucketSuccess = await testBucket();
    } else {
      console.log('\n⚠️ Skipping bucket tests due to missing environment variables');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY:');
  console.log('='.repeat(60));
  console.log(`Database Connection: ${dbSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Environment Variables: ${envSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`DigitalOcean Spaces: ${bucketSuccess ? '✅ PASS' : envSuccess ? '❌ FAIL' : '⚠️ SKIPPED'}`);
  
  if (dbSuccess && bucketSuccess) {
    console.log('\n🎉 All tests passed! Your system is ready to go.');
  } else if (dbSuccess && !envSuccess) {
    console.log('\n⚠️ Database works but bucket needs environment variables setup.');
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above.');
  }
}

// Check if required packages are installed
try {
  require('pg');
  require('aws-sdk');
} catch (error) {
  console.error('❌ Missing required packages. Please run:');
  console.error('npm install pg aws-sdk');
  process.exit(1);
}

// Run the tests
runTests().catch(console.error); 