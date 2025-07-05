const TrustPortalTokenManager = require('./trust-portal-token');
const EnterpriseFeedbackManager = require('./enterprise-feedback');
const fetch = require('node-fetch');

const API_BASE_URL = 'https://garnet-compliance-saas-production.up.railway.app';

async function testTrustPortalFunctionality() {
  const tokenManager = new TrustPortalTokenManager();
  const feedbackManager = new EnterpriseFeedbackManager();

  try {
    // Connect to database
    await tokenManager.connect();
    await feedbackManager.connect();

    console.log('1. Testing token generation and validation...');
    
    // Generate token for a vendor
    const vendorId = 1; // Replace with actual vendor ID
    const newToken = await tokenManager.generateInviteToken(vendorId);
    console.log('Generated token:', newToken);

    // Validate token
    const validation = await tokenManager.validateToken(newToken.token);
    console.log('Token validation:', validation);

    console.log('\n2. Testing trust portal API endpoints...');

    // Test public trust portal access
    const publicAccessResponse = await fetch(`${API_BASE_URL}/api/trust-portal/invite/${newToken.token}`);
    const publicAccessData = await publicAccessResponse.json();
    console.log('Public access response:', publicAccessData);

    // Test getting vendor items
    const itemsResponse = await fetch(`${API_BASE_URL}/api/trust-portal/items?vendorId=${vendorId}`);
    const itemsData = await itemsResponse.json();
    console.log('Vendor items:', itemsData);

    console.log('\n3. Testing enterprise feedback...');

    // Create test feedback
    const testFeedback = await feedbackManager.createFeedback({
      vendorId,
      enterpriseName: 'Test Enterprise',
      feedbackText: 'Test feedback for trust portal',
      rating: 5,
      isPublic: true
    });
    console.log('Created feedback:', testFeedback);

    // Get dashboard feedback
    const dashboardFeedback = await feedbackManager.getDashboardFeedback(vendorId);
    console.log('Dashboard feedback:', dashboardFeedback);

    console.log('\n4. Testing send to trust portal functionality...');

    // Test sending an item to trust portal
    const testItem = {
      vendorId,
      title: 'Test Item',
      description: 'Test description',
      category: 'Security',
      content: 'Test content'
    };

    const sendToPortalResponse = await fetch(`${API_BASE_URL}/api/trust-portal/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testItem)
    });
    const sendToPortalData = await sendToPortalResponse.json();
    console.log('Send to portal response:', sendToPortalData);

    console.log('\nAll tests completed successfully!');

  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    // Close database connections
    await tokenManager.disconnect();
    await feedbackManager.disconnect();
  }
}

// Run the tests
testTrustPortalFunctionality().catch(console.error); 