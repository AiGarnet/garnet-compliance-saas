const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testFeedbackAndActivities() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing Feedback and Activities System...\n');
    
    // Test 1: Insert a test activity
    console.log('📝 Test 1: Creating test activity...');
    const insertActivity = await client.query(`
      INSERT INTO activities (user_id, activity_type, entity_type, entity_id, description, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;
    `, [
      '550e8400-e29b-41d4-a716-446655440000', // Test UUID
      'CLIENT_CREATED',
      'vendor',
      123,
      'Test user created a new vendor',
      JSON.stringify({
        status: 'SUCCESS',
        userName: 'Test User',
        userEmail: 'test@example.com',
        entityName: 'Test Vendor',
        toastConfig: {
          title: 'Success',
          message: 'Vendor created successfully',
          type: 'success'
        }
      })
    ]);
    
    if (insertActivity.rows.length > 0) {
      console.log('✅ Activity created successfully:');
      console.table(insertActivity.rows);
    } else {
      console.log('❌ Failed to create activity');
    }
    
    // Test 2: Query recent activities
    console.log('\n📊 Test 2: Querying recent activities...');
    const recentActivities = await client.query(`
      SELECT activity_id, user_id, activity_type, entity_type, entity_id, description, metadata, created_at
      FROM activities 
      ORDER BY created_at DESC 
      LIMIT 5;
    `);
    
    if (recentActivities.rows.length > 0) {
      console.log('✅ Recent activities found:');
      console.table(recentActivities.rows);
    } else {
      console.log('❌ No recent activities found');
    }
    
    // Test 3: Insert test feedback
    console.log('\n💬 Test 3: Creating test feedback...');
    const insertFeedback = await client.query(`
      INSERT INTO trust_portal_feedback (
        vendor_id, 
        enterprise_contact_name, 
        enterprise_contact_email, 
        enterprise_company_name,
        feedback_type,
        subject,
        message,
        status,
        priority,
        invite_token,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *;
    `, [
      1, // vendor_id
      'John Doe',
      'john@enterprise.com',
      'Enterprise Corp',
      'general',
      'Test Feedback',
      'This is a test feedback message',
      'pending',
      'medium',
      'test-token-123'
    ]);
    
    if (insertFeedback.rows.length > 0) {
      console.log('✅ Feedback created successfully:');
      console.table(insertFeedback.rows);
    } else {
      console.log('❌ Failed to create feedback');
    }
    
    // Test 4: Query feedback
    console.log('\n💬 Test 4: Querying feedback...');
    const feedbackData = await client.query(`
      SELECT id, vendor_id, enterprise_contact_name, enterprise_contact_email, 
             enterprise_company_name, feedback_type, subject, message, status, 
             priority, created_at
      FROM trust_portal_feedback 
      ORDER BY created_at DESC 
      LIMIT 5;
    `);
    
    if (feedbackData.rows.length > 0) {
      console.log('✅ Feedback found:');
      console.table(feedbackData.rows);
    } else {
      console.log('❌ No feedback found');
    }
    
    // Test 5: Test API endpoint URLs
    console.log('\n🌐 Test 5: Testing API endpoint connectivity...');
    const backendUrl = 'https://garnet-compliance-saas-production.up.railway.app';
    
    try {
      const response = await fetch(`${backendUrl}/api/activities/recent?limit=5`);
      console.log(`✅ Activities API Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Activities API Response:', data);
      } else {
        console.log('❌ Activities API Error:', await response.text());
      }
    } catch (error) {
      console.log('❌ Activities API Connection Error:', error.message);
    }
    
    // Test 6: Test trust portal feedback endpoint
    console.log('\n💬 Test 6: Testing feedback API endpoint...');
    try {
      const feedbackResponse = await fetch(`${backendUrl}/api/trust-portal/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId: 1,
          enterpriseContactName: 'API Test User',
          enterpriseContactEmail: 'apitest@example.com',
          enterpriseCompanyName: 'API Test Corp',
          feedbackType: 'general',
          subject: 'API Test Feedback',
          message: 'This is a test feedback via API',
          priority: 'medium',
          inviteToken: 'api-test-token'
        })
      });
      
      console.log(`✅ Feedback API Status: ${feedbackResponse.status}`);
      
      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        console.log('✅ Feedback API Response:', feedbackData);
      } else {
        console.log('❌ Feedback API Error:', await feedbackResponse.text());
      }
    } catch (error) {
      console.log('❌ Feedback API Connection Error:', error.message);
    }
    
    console.log('\n🎉 Testing completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test
testFeedbackAndActivities().catch(console.error); 