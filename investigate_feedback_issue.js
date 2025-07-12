const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
});

const backendUrl = 'https://garnet-compliance-saas-production.up.railway.app';

async function investigateFeedbackIssue() {
  console.log('🔍 COMPREHENSIVE FEEDBACK SYSTEM INVESTIGATION\n');

  try {
    // 1. Check database schema and data
    console.log('1. 📊 DATABASE INVESTIGATION...');
    
    // Check if feedback table exists and its structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'trust_portal_feedback' 
      ORDER BY ordinal_position;
    `);
    
    console.log('   ✅ Feedback table structure:');
    tableInfo.rows.forEach(col => {
      console.log(`      ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check existing feedback data
    const feedbackCount = await pool.query('SELECT COUNT(*) as count FROM trust_portal_feedback');
    console.log(`   ✅ Total feedback records: ${feedbackCount.rows[0].count}`);

    // Check recent feedback
    const recentFeedback = await pool.query(`
      SELECT id, vendor_id, enterprise_contact_email, feedback_type, subject, status, created_at 
      FROM trust_portal_feedback 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log('   ✅ Recent feedback:');
    recentFeedback.rows.forEach(fb => {
      console.log(`      ID: ${fb.id}, Vendor: ${fb.vendor_id}, Email: ${fb.enterprise_contact_email}, Type: ${fb.feedback_type}, Status: ${fb.status}`);
    });

    // 2. Test API endpoints
    console.log('\n2. 🌐 API ENDPOINTS TESTING...');

    // Test POST feedback
    console.log('   Testing POST /api/trust-portal/feedback...');
    const testFeedbackData = {
      vendorId: 1,
      enterpriseContactName: 'Investigation Test',
      enterpriseContactEmail: 'investigation@test.com',
      enterpriseCompanyName: 'Test Investigation Corp',
      feedbackType: 'general',
      priority: 'medium',
      subject: 'Investigation Test Subject',
      message: 'This is a test message for investigation',
      inviteToken: '1752213296666_ww369dkf4'
    };

    const postResponse = await fetch(`${backendUrl}/api/trust-portal/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://www.garnetai.net'
      },
      body: JSON.stringify(testFeedbackData)
    });

    console.log(`      Status: ${postResponse.status}`);
    if (postResponse.ok) {
      const result = await postResponse.json();
      console.log(`      ✅ Success: Created feedback with ID ${result.id}`);
    } else {
      const error = await postResponse.text();
      console.log(`      ❌ Error: ${error}`);
    }

    // Test GET vendor feedback
    console.log('\n   Testing GET /api/trust-portal/vendor/1/feedback...');
    const getVendorResponse = await fetch(`${backendUrl}/api/trust-portal/vendor/1/feedback`);
    console.log(`      Status: ${getVendorResponse.status}`);
    if (getVendorResponse.ok) {
      const result = await getVendorResponse.json();
      console.log(`      ✅ Success: Retrieved ${result.length} feedback items`);
    } else {
      const error = await getVendorResponse.text();
      console.log(`      ❌ Error: ${error}`);
    }

    // Test GET all feedback (should require auth)
    console.log('\n   Testing GET /api/trust-portal/feedback (without auth)...');
    const getAllResponse = await fetch(`${backendUrl}/api/trust-portal/feedback`);
    console.log(`      Status: ${getAllResponse.status}`);
    if (getAllResponse.status === 404) {
      console.log('      ⚠️  Endpoint not deployed yet (404)');
    } else if (getAllResponse.status === 401) {
      console.log('      ✅ Correctly requires authentication (401)');
    } else {
      const error = await getAllResponse.text();
      console.log(`      ❌ Unexpected response: ${error}`);
    }

    // Test new vendor-specific POST endpoint
    console.log('\n   Testing POST /api/trust-portal/vendor/1/feedback...');
    const vendorTestData = {
      enterpriseContactName: 'Vendor Endpoint Test',
      enterpriseContactEmail: 'vendor-endpoint@test.com',
      enterpriseCompanyName: 'Vendor Test Corp',
      feedbackType: 'clarification',
      priority: 'high',
      subject: 'Vendor Endpoint Test',
      message: 'Testing vendor-specific endpoint'
    };

    const postVendorResponse = await fetch(`${backendUrl}/api/trust-portal/vendor/1/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://www.garnetai.net'
      },
      body: JSON.stringify(vendorTestData)
    });

    console.log(`      Status: ${postVendorResponse.status}`);
    if (postVendorResponse.status === 404) {
      console.log('      ⚠️  Endpoint not deployed yet (404)');
    } else if (postVendorResponse.ok) {
      const result = await postVendorResponse.json();
      console.log(`      ✅ Success: Created feedback with ID ${result.id}`);
    } else {
      const error = await postVendorResponse.text();
      console.log(`      ❌ Error: ${error}`);
    }

    // 3. Check vendor data
    console.log('\n3. 👥 VENDOR DATA INVESTIGATION...');
    const vendorData = await pool.query(`
      SELECT vendor_id, uuid, company_name, contact_email, status 
      FROM vendors 
      WHERE vendor_id = 1
    `);
    
    if (vendorData.rows.length > 0) {
      const vendor = vendorData.rows[0];
      console.log(`   ✅ Vendor 1 exists: ${vendor.company_name} (${vendor.contact_email})`);
      console.log(`      UUID: ${vendor.uuid}, Status: ${vendor.status}`);
    } else {
      console.log('   ❌ Vendor 1 not found in database');
    }

    // 4. Check invite token
    console.log('\n4. 🎫 INVITE TOKEN INVESTIGATION...');
    const tokenData = await pool.query(`
      SELECT * FROM vendor_invite_tokens 
      WHERE token = '1752213296666_ww369dkf4'
    `);
    
    if (tokenData.rows.length > 0) {
      const token = tokenData.rows[0];
      console.log(`   ✅ Invite token exists for vendor: ${token.vendor_id}`);
      console.log(`      Expires: ${token.expires_at}, Used: ${token.is_used}`);
    } else {
      console.log('   ❌ Invite token not found in database');
    }

    // 5. Test with exact frontend data format
    console.log('\n5. 🎯 FRONTEND SIMULATION TEST...');
    const frontendData = {
      "enterpriseContactEmail": "test@frontend.com",
      "enterpriseContactName": "Frontend Test",
      "enterpriseCompanyName": "Frontend Corp",
      "feedbackType": "general",
      "priority": "medium",
      "subject": "Frontend Test Subject",
      "message": "Frontend test message",
      "vendorId": 1,
      "inviteToken": "1752213296666_ww369dkf4"
    };

    const frontendResponse = await fetch(`${backendUrl}/api/trust-portal/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://www.garnetai.net',
        'Referer': 'https://www.garnetai.net/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify(frontendData)
    });

    console.log(`   Frontend simulation status: ${frontendResponse.status}`);
    if (frontendResponse.ok) {
      const result = await frontendResponse.json();
      console.log(`   ✅ Success: Frontend simulation worked, ID ${result.id}`);
    } else {
      const error = await frontendResponse.text();
      console.log(`   ❌ Frontend simulation failed: ${error}`);
    }

    console.log('\n🎉 INVESTIGATION COMPLETED!');

  } catch (error) {
    console.error('❌ Investigation failed:', error);
  } finally {
    await pool.end();
  }
}

investigateFeedbackIssue(); 