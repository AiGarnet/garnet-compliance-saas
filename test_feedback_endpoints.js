const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
});

async function testFeedbackEndpoints() {
  console.log('🧪 Testing Feedback Endpoints...\n');

  const backendUrl = 'https://garnet-compliance-saas-production.up.railway.app';

  try {
    // Test 1: POST feedback (should work)
    console.log('1. Testing POST /api/trust-portal/feedback...');
    const feedbackData = {
      vendorId: 1,
      enterpriseContactName: 'Test User',
      enterpriseContactEmail: 'test@example.com',
      enterpriseCompanyName: 'Test Company',
      feedbackType: 'general',
      priority: 'medium',
      subject: 'Test Subject',
      message: 'Test Message',
      inviteToken: '1752213296666_ww369dkf4'
    };

    const postResponse = await fetch(`${backendUrl}/api/trust-portal/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData)
    });

    console.log(`   Status: ${postResponse.status}`);
    if (postResponse.ok) {
      const result = await postResponse.json();
      console.log(`   ✅ Feedback created with ID: ${result.id}`);
    } else {
      const error = await postResponse.text();
      console.log(`   ❌ Error: ${error}`);
    }

    // Test 2: GET vendor feedback (should work)
    console.log('\n2. Testing GET /api/trust-portal/vendor/1/feedback...');
    const getVendorResponse = await fetch(`${backendUrl}/api/trust-portal/vendor/1/feedback`);
    console.log(`   Status: ${getVendorResponse.status}`);
    if (getVendorResponse.ok) {
      const result = await getVendorResponse.json();
      console.log(`   ✅ Found ${result.length} feedback items for vendor 1`);
    } else {
      const error = await getVendorResponse.text();
      console.log(`   ❌ Error: ${error}`);
    }

    // Test 3: GET all feedback (should require auth)
    console.log('\n3. Testing GET /api/trust-portal/feedback (without auth)...');
    const getAllResponse = await fetch(`${backendUrl}/api/trust-portal/feedback`);
    console.log(`   Status: ${getAllResponse.status}`);
    if (getAllResponse.status === 404) {
      console.log('   ⚠️  Endpoint not deployed yet (404)');
    } else if (getAllResponse.status === 401) {
      console.log('   ✅ Correctly requires authentication (401)');
    } else {
      const error = await getAllResponse.text();
      console.log(`   ❌ Unexpected response: ${error}`);
    }

    // Test 4: POST vendor-specific feedback (should work)
    console.log('\n4. Testing POST /api/trust-portal/vendor/1/feedback...');
    const vendorFeedbackData = {
      enterpriseContactName: 'Vendor Test User',
      enterpriseContactEmail: 'vendor-test@example.com',
      enterpriseCompanyName: 'Vendor Test Company',
      feedbackType: 'clarification',
      priority: 'high',
      subject: 'Vendor Specific Test',
      message: 'This is a vendor-specific feedback test',
      inviteToken: '1752213296666_ww369dkf4'
    };

    const postVendorResponse = await fetch(`${backendUrl}/api/trust-portal/vendor/1/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vendorFeedbackData)
    });

    console.log(`   Status: ${postVendorResponse.status}`);
    if (postVendorResponse.status === 404) {
      console.log('   ⚠️  Endpoint not deployed yet (404)');
    } else if (postVendorResponse.ok) {
      const result = await postVendorResponse.json();
      console.log(`   ✅ Vendor feedback created with ID: ${result.id}`);
    } else {
      const error = await postVendorResponse.text();
      console.log(`   ❌ Error: ${error}`);
    }

    // Test 5: Check database directly
    console.log('\n5. Checking database feedback count...');
    const dbResult = await pool.query('SELECT COUNT(*) as count FROM trust_portal_feedback');
    console.log(`   ✅ Database has ${dbResult.rows[0].count} feedback records`);

    console.log('\n🎉 Feedback endpoints test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testFeedbackEndpoints(); 