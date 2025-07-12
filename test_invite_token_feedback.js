const { Client } = require('pg');

// Database connection configuration
const connectionString = 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway';
const backendUrl = 'https://garnet-compliance-saas-production.up.railway.app';

async function testInviteTokenFeedback() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database successfully!');
    
    const token = '1752213296666_ww369dkf4';
    console.log(`🔍 Testing feedback submission for invite token: ${token}`);
    console.log('='.repeat(60));
    
    // Step 1: Get vendor data via invite token (same as frontend)
    console.log('\n1️⃣ Testing GET /api/trust-portal/invite/{token}');
    const inviteResponse = await fetch(`${backendUrl}/api/trust-portal/invite/${token}`);
    console.log(`   Status: ${inviteResponse.status}`);
    
    if (!inviteResponse.ok) {
      console.log(`   ❌ Failed to get vendor data: ${inviteResponse.statusText}`);
      return;
    }
    
    const vendorData = await inviteResponse.json();
    console.log(`   ✅ Got vendor data for: ${vendorData.vendor.companyName}`);
    console.log(`   📋 Vendor ID: ${vendorData.vendor.id}`);
    console.log(`   📋 Vendor UUID: ${vendorData.vendor.uuid}`);
    
    // Step 2: Test the exact feedback payload that frontend sends
    console.log('\n2️⃣ Testing feedback submission with exact frontend payload');
    const feedbackPayload = {
      enterpriseContactEmail: 'test@example.com',
      enterpriseContactName: 'Test User',
      enterpriseCompanyName: 'Test Company',
      feedbackType: 'general',
      priority: 'medium',
      subject: 'Test Feedback',
      message: 'This is a test feedback message from invite token',
      vendorId: vendorData.vendor.id,
      inviteToken: token
    };
    
    console.log('   📤 Payload:');
    console.log(JSON.stringify(feedbackPayload, null, 2));
    
    // Test the endpoint that frontend is calling
    console.log('\n3️⃣ Testing POST /api/trust-portal/feedback (frontend endpoint)');
    const feedbackResponse = await fetch(`${backendUrl}/api/trust-portal/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackPayload)
    });
    
    console.log(`   Status: ${feedbackResponse.status}`);
    
    if (feedbackResponse.ok) {
      const result = await feedbackResponse.json();
      console.log('   ✅ Feedback submitted successfully!');
      console.log('   📋 Response:', JSON.stringify(result, null, 2));
    } else {
      console.log(`   ❌ Feedback submission failed: ${feedbackResponse.statusText}`);
      try {
        const errorData = await feedbackResponse.json();
        console.log('   🔍 Error details:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('   🔍 Error text:', await feedbackResponse.text());
      }
    }
    
    // Step 4: Test alternative vendor-specific endpoint
    console.log(`\n4️⃣ Testing POST /api/trust-portal/vendor/${vendorData.vendor.id}/feedback`);
    const vendorFeedbackResponse = await fetch(`${backendUrl}/api/trust-portal/vendor/${vendorData.vendor.id}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        enterpriseContactEmail: 'test@example.com',
        enterpriseContactName: 'Test User',
        enterpriseCompanyName: 'Test Company',
        feedbackType: 'general',
        priority: 'medium',
        subject: 'Test Feedback - Vendor Specific',
        message: 'This is a test feedback message via vendor-specific endpoint'
      })
    });
    
    console.log(`   Status: ${vendorFeedbackResponse.status}`);
    
    if (vendorFeedbackResponse.ok) {
      const result = await vendorFeedbackResponse.json();
      console.log('   ✅ Vendor-specific feedback submitted successfully!');
      console.log('   📋 Response:', JSON.stringify(result, null, 2));
    } else {
      console.log(`   ❌ Vendor-specific feedback submission failed: ${vendorFeedbackResponse.statusText}`);
      try {
        const errorData = await vendorFeedbackResponse.json();
        console.log('   🔍 Error details:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('   🔍 Error text:', await vendorFeedbackResponse.text());
      }
    }
    
    // Step 5: Check what feedback exists in database
    console.log('\n5️⃣ Checking feedback in database');
    const feedbackQuery = `
      SELECT 
        id,
        vendor_id,
        enterprise_contact_email,
        enterprise_contact_name,
        feedback_type,
        priority,
        subject,
        message,
        created_at
      FROM trust_portal_feedback
      WHERE vendor_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    const feedbackResult = await client.query(feedbackQuery, [vendorData.vendor.id]);
    console.log(`   📋 Found ${feedbackResult.rows.length} feedback records for vendor ${vendorData.vendor.id}`);
    
    if (feedbackResult.rows.length > 0) {
      feedbackResult.rows.forEach((feedback, index) => {
        console.log(`   ${index + 1}. ${feedback.subject} (${feedback.feedback_type})`);
        console.log(`      From: ${feedback.enterprise_contact_name} <${feedback.enterprise_contact_email}>`);
        console.log(`      Priority: ${feedback.priority}`);
        console.log(`      Created: ${feedback.created_at}`);
        console.log('');
      });
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await client.end();
  }
}

// Run the test
testInviteTokenFeedback().catch(console.error); 