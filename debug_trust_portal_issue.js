const fetch = require('node-fetch');

// Test script to debug trust portal checklist sending issues
async function debugTrustPortalIssue() {
  console.log('🔍 DEBUGGING TRUST PORTAL CHECKLIST SENDING ISSUE');
  console.log('=' * 60);

  // Configuration
  const backendUrl = 'https://garnet-compliance-saas-production.up.railway.app';
  
  // Test authentication first
  console.log('\n1️⃣ TESTING AUTHENTICATION...');
  try {
    const loginResponse = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com', // You'll need to use your actual test credentials
        password: 'password'
      })
    });

    console.log('Login response status:', loginResponse.status);
    
    if (!loginResponse.ok) {
      console.log('❌ Authentication failed - cannot proceed with vendor testing');
      console.log('Please update the credentials in this script and try again');
      return;
    }

    const authData = await loginResponse.json();
    console.log('✅ Authentication successful');
    console.log('User data:', {
      email: authData.user?.email,
      role: authData.user?.role,
      organizationId: authData.user?.organization_id,
      organization: authData.user?.organization
    });

    const token = authData.access_token || authData.token;
    if (!token) {
      console.log('❌ No authentication token received');
      return;
    }

    // Test vendor access with authentication
    console.log('\n2️⃣ TESTING VENDOR ACCESS WITH AUTHENTICATION...');
    
    const organizationId = authData.user?.organization_id;
    if (!organizationId) {
      console.log('❌ No organization ID found in user data');
      return;
    }

    const vendorsUrl = `${backendUrl}/api/vendors?organization_id=${organizationId}`;
    console.log('Making request to:', vendorsUrl);
    
    const vendorsResponse = await fetch(vendorsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Vendors response status:', vendorsResponse.status);
    
    if (!vendorsResponse.ok) {
      const errorText = await vendorsResponse.text();
      console.log('❌ Vendors request failed:', errorText);
      return;
    }

    const vendorsData = await vendorsResponse.json();
    console.log('✅ Vendors request successful');
    console.log('Vendors count:', vendorsData.data?.length || 0);
    
    if (vendorsData.data && vendorsData.data.length > 0) {
      console.log('Sample vendor:', {
        id: vendorsData.data[0].vendorId || vendorsData.data[0].id,
        uuid: vendorsData.data[0].uuid,
        name: vendorsData.data[0].companyName || vendorsData.data[0].name,
        organizationId: vendorsData.data[0].organizationId
      });

      // Test getVendorIdFromUuid conversion
      console.log('\n3️⃣ TESTING VENDOR UUID TO ID CONVERSION...');
      const testVendor = vendorsData.data[0];
      const vendorUuid = testVendor.uuid;
      const expectedVendorId = testVendor.vendorId || testVendor.id;
      
      console.log('Testing conversion:', {
        uuid: vendorUuid,
        expectedId: expectedVendorId
      });

      // This simulates the getVendorIdFromUuid function
      const foundVendor = vendorsData.data.find(v => v.uuid === vendorUuid);
      if (foundVendor) {
        const convertedId = foundVendor.vendorId || foundVendor.vendor_id || foundVendor.id;
        console.log('✅ Conversion successful:', {
          uuid: vendorUuid,
          convertedId: convertedId,
          expectedId: expectedVendorId,
          match: convertedId === expectedVendorId
        });
      } else {
        console.log('❌ Vendor not found during conversion');
      }

      // Test trust portal endpoint
      console.log('\n4️⃣ TESTING TRUST PORTAL ENDPOINT...');
      
      const trustPortalData = {
        title: 'Test Checklist Submission',
        description: 'Testing trust portal submission for debugging',
        category: 'Questionnaire',
        vendorId: expectedVendorId,
        isQuestionnaireAnswer: true,
        content: JSON.stringify({
          documentType: 'test_submission',
          submissionDate: new Date().toISOString(),
          testData: true
        })
      };

      console.log('Sending test data to trust portal:', trustPortalData);

      const trustPortalResponse = await fetch(`${backendUrl}/api/trust-portal/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(trustPortalData)
      });

      console.log('Trust portal response status:', trustPortalResponse.status);

      if (trustPortalResponse.ok) {
        const result = await trustPortalResponse.json();
        console.log('✅ Trust portal submission successful:', result);
      } else {
        const errorText = await trustPortalResponse.text();
        console.log('❌ Trust portal submission failed:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          console.log('Error details:', errorJson);
        } catch (e) {
          console.log('Raw error text:', errorText);
        }
      }

      // Test checklist-specific endpoint
      console.log('\n5️⃣ TESTING CHECKLIST-SPECIFIC ENDPOINT...');
      
      // First check if there are any checklists for this vendor
      const checklistsResponse = await fetch(`${backendUrl}/api/checklists/vendor/${vendorUuid}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Checklists response status:', checklistsResponse.status);

      if (checklistsResponse.ok) {
        const checklistsData = await checklistsResponse.json();
        console.log('Checklists found:', checklistsData.length || 0);
        
        if (checklistsData.length > 0) {
          const testChecklistId = checklistsData[0].id;
          console.log('Testing with checklist ID:', testChecklistId);
          
          const checklistEndpoint = `${backendUrl}/api/checklists/${testChecklistId}/vendor/${vendorUuid}/send-to-trust-portal`;
          console.log('Testing checklist endpoint:', checklistEndpoint);
          
          const checklistSubmissionResponse = await fetch(checklistEndpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              title: 'Test Checklist Submission',
              message: 'Testing checklist submission for debugging',
              isFollowUp: false,
              followUpType: 'initial',
              followUpReason: '',
              parentSubmissionId: null
            })
          });

          console.log('Checklist submission response status:', checklistSubmissionResponse.status);

          if (checklistSubmissionResponse.ok) {
            const result = await checklistSubmissionResponse.json();
            console.log('✅ Checklist submission successful:', result);
          } else {
            const errorText = await checklistSubmissionResponse.text();
            console.log('❌ Checklist submission failed:', errorText);
          }
        } else {
          console.log('ℹ️ No checklists found for testing checklist-specific endpoint');
        }
      } else {
        console.log('❌ Failed to fetch checklists for testing');
      }

    } else {
      console.log('❌ No vendors found - cannot test trust portal submission');
    }

  } catch (error) {
    console.error('❌ Debug script error:', error);
  }

  console.log('\n📋 DEBUGGING SUMMARY:');
  console.log('If you see failures above, the issues are likely:');
  console.log('1. Authentication problems (expired tokens, wrong credentials)');
  console.log('2. Organization filtering issues (user not in organization)');
  console.log('3. Vendor ID conversion problems (UUID -> numeric ID)');
  console.log('4. Trust portal endpoint authentication requirements');
  console.log('5. Missing or invalid checklist data');
  console.log('\nCheck the browser console logs for detailed error messages.');
}

// Run the debug script
debugTrustPortalIssue().catch(console.error); 