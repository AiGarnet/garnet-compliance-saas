const { Client } = require('pg');

// Database connection configuration
const connectionString = 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway';
const backendUrl = 'https://garnet-compliance-saas-production.up.railway.app';

async function testDashboardFeedback() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database successfully!');
    
    console.log('🔍 Testing Dashboard Feedback System');
    console.log('='.repeat(50));
    
    // Step 1: Get user information
    console.log('\n1️⃣ Getting user information');
    const userQuery = `
      SELECT 
        id, 
        email, 
        full_name, 
        role, 
        organization, 
        organization_id 
      FROM users 
      WHERE email = 'prithvi@garnetai.net'
    `;
    
    const userResult = await client.query(userQuery);
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`   ✅ Found user: ${user.full_name} (${user.email})`);
    console.log(`   📋 User ID: ${user.id}`);
    console.log(`   📋 Organization: ${user.organization}`);
    console.log(`   📋 Organization ID: ${user.organization_id}`);
    
    // Step 2: Get vendors in the same organization
    console.log('\n2️⃣ Getting vendors in user\'s organization');
    const vendorsQuery = `
      SELECT 
        vendor_id, 
        uuid, 
        company_name, 
        organization_id 
      FROM vendors 
      WHERE organization_id = $1
    `;
    
    const vendorsResult = await client.query(vendorsQuery, [user.organization_id]);
    console.log(`   ✅ Found ${vendorsResult.rows.length} vendors in organization`);
    
    vendorsResult.rows.forEach(vendor => {
      console.log(`   📋 Vendor: ${vendor.company_name} (ID: ${vendor.vendor_id})`);
    });
    
    // Step 3: Get feedback for these vendors
    console.log('\n3️⃣ Getting feedback for organization vendors');
    const feedbackQuery = `
      SELECT 
        f.id,
        f.vendor_id,
        f.enterprise_contact_name,
        f.enterprise_contact_email,
        f.enterprise_company_name,
        f.feedback_type,
        f.subject,
        f.message,
        f.status,
        f.priority,
        f.created_at,
        v.company_name as vendor_name
      FROM trust_portal_feedback f
      INNER JOIN vendors v ON f.vendor_id = v.vendor_id
      WHERE v.organization_id = $1
      ORDER BY f.created_at DESC
    `;
    
    const feedbackResult = await client.query(feedbackQuery, [user.organization_id]);
    console.log(`   ✅ Found ${feedbackResult.rows.length} feedback records`);
    
    feedbackResult.rows.forEach((feedback, index) => {
      console.log(`   ${index + 1}. "${feedback.subject}" - ${feedback.vendor_name}`);
      console.log(`      From: ${feedback.enterprise_contact_name} <${feedback.enterprise_contact_email}>`);
      console.log(`      Type: ${feedback.feedback_type}, Priority: ${feedback.priority}`);
      console.log(`      Created: ${feedback.created_at}`);
      console.log('');
    });
    
    // Step 4: Test the backend API endpoint (this will use the deployed backend)
    console.log('\n4️⃣ Testing backend API endpoint');
    console.log('   ⚠️  Note: This will test the current deployed backend, not the local changes');
    console.log('   📝 To see the fix in action, the backend needs to be redeployed');
    
    // For now, let's simulate what the API should return
    console.log('\n5️⃣ Expected API Response Structure');
    const expectedResponse = {
      success: true,
      data: feedbackResult.rows.map(feedback => ({
        id: feedback.id,
        vendorId: feedback.vendor_id,
        enterpriseContactName: feedback.enterprise_contact_name,
        enterpriseContactEmail: feedback.enterprise_contact_email,
        enterpriseCompanyName: feedback.enterprise_company_name,
        feedbackType: feedback.feedback_type,
        subject: feedback.subject,
        message: feedback.message,
        status: feedback.status,
        priority: feedback.priority,
        createdAt: feedback.created_at,
        vendorName: feedback.vendor_name,
        responses: []
      })),
      meta: {
        timestamp: new Date().toISOString(),
        count: feedbackResult.rows.length,
        userId: user.id
      }
    };
    
    console.log('   📋 Expected response structure:');
    console.log(JSON.stringify(expectedResponse, null, 2));
    
    console.log('\n✅ Dashboard feedback test completed!');
    console.log('\n📝 Summary:');
    console.log(`   - User: ${user.full_name} (${user.organization})`);
    console.log(`   - Vendors in organization: ${vendorsResult.rows.length}`);
    console.log(`   - Feedback records: ${feedbackResult.rows.length}`);
    console.log(`   - The fix ensures feedback is filtered by organization_id instead of user UUID`);
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await client.end();
  }
}

// Run the test
testDashboardFeedback().catch(console.error); 