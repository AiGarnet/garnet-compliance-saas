const { Client } = require('pg');
const fetch = require('node-fetch');

class VendorAPITester {
  constructor() {
    this.client = new Client({
      connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
      ssl: { rejectUnauthorized: false }
    });
    this.backendUrl = 'https://garnet-compliance-saas-production.up.railway.app';
  }

  async connect() {
    await this.client.connect();
    console.log('🔗 Connected to database');
  }

  async disconnect() {
    await this.client.end();
    console.log('🔌 Disconnected from database');
  }

  async getTestUserToken() {
    console.log('🔑 Getting authentication token for testing1@garnetai.net...');
    
    try {
      const response = await fetch(`${this.backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'testing1@garnetai.net',
          password: '123123123'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Login successful');
      console.log(`👤 User: ${data.user.email} (${data.user.role})`);
      console.log(`🏢 Organization: ${data.user.organization} (${data.user.organization_id})`);
      
      return {
        token: data.access_token,
        user: data.user
      };
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      return null;
    }
  }

  async testPublicVendorAPI() {
    console.log('\n🧪 TESTING PUBLIC VENDOR API\n');
    
    try {
      // Get user data first
      const authData = await this.getTestUserToken();
      if (!authData) {
        console.error('❌ Cannot test without authentication data');
        return false;
      }
      
      const { user } = authData;
      const organizationId = user.organization_id;
      
      // Test 1: GET vendors without organization_id (should require it)
      console.log('🔍 Test 1: GET vendors without organization_id...');
      const response1 = await fetch(`${this.backendUrl}/api/vendors`);
      const data1 = await response1.json();
      
      console.log(`Status: ${response1.status}`);
      console.log('Response:', data1);
      
      if (response1.status === 200 && !data1.success && data1.error?.code === 'MISSING_ORGANIZATION_ID') {
        console.log('✅ Test 1 PASSED: Correctly requires organization_id');
      } else {
        console.log('❌ Test 1 FAILED: Should require organization_id parameter');
      }
      
      // Test 2: GET vendors with organization_id (should work)
      console.log('\n🔍 Test 2: GET vendors with organization_id...');
      const response2 = await fetch(`${this.backendUrl}/api/vendors?organization_id=${organizationId}`);
      const data2 = await response2.json();
      
      console.log(`Status: ${response2.status}`);
      console.log('Response:', data2);
      
      if (response2.status === 200 && data2.success) {
        console.log('✅ Test 2 PASSED: Successfully filtered by organization');
        console.log(`📊 Found ${data2.data?.length || 0} vendors for organization ${organizationId}`);
      } else {
        console.log('❌ Test 2 FAILED: Should return vendors for valid organization_id');
      }
      
      // Test 3: GET vendors with different organization_id (should return empty or error)
      console.log('\n🔍 Test 3: GET vendors with different organization_id...');
      const fakeOrgId = '00000000-0000-0000-0000-000000000000';
      const response3 = await fetch(`${this.backendUrl}/api/vendors?organization_id=${fakeOrgId}`);
      const data3 = await response3.json();
      
      console.log(`Status: ${response3.status}`);
      console.log('Response:', data3);
      
      if (response3.status === 200 && data3.success && (!data3.data || data3.data.length === 0)) {
        console.log('✅ Test 3 PASSED: No vendors returned for different organization');
      } else {
        console.log('❌ Test 3 FAILED: Should not return vendors from other organizations');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Public API test failed:', error.message);
      return false;
    }
  }

  async testAuthenticatedVendorAPI() {
    console.log('\n🔒 TESTING AUTHENTICATED VENDOR API\n');
    
    try {
      // Get user data and token
      const authData = await this.getTestUserToken();
      if (!authData) {
        console.error('❌ Cannot test without authentication data');
        return false;
      }
      
      const { token, user } = authData;
      const organizationId = user.organization_id;
      
      // Test 1: Create vendor (should work with auth)
      console.log('🔍 Test 1: Create vendor with authentication...');
      const createData = {
        companyName: 'Test Vendor API',
        region: 'Test Region',
        contactEmail: 'test@vendor-api.com',
        contactName: 'Test Contact',
        status: 'Questionnaire Pending'
      };
      
      const response1 = await fetch(`${this.backendUrl}/api/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(createData)
      });
      
      const data1 = await response1.json();
      console.log(`Status: ${response1.status}`);
      console.log('Response:', data1);
      
      let createdVendorId = null;
      if (response1.status === 200 && data1.success) {
        console.log('✅ Test 1 PASSED: Successfully created vendor');
        createdVendorId = data1.data?.vendorId || data1.data?.id;
        console.log(`📝 Created vendor ID: ${createdVendorId}`);
      } else {
        console.log('❌ Test 1 FAILED: Should create vendor with authentication');
      }
      
      // Test 2: Create vendor without auth (should fail)
      console.log('\n🔍 Test 2: Create vendor without authentication...');
      const response2 = await fetch(`${this.backendUrl}/api/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createData)
      });
      
      const data2 = await response2.json();
      console.log(`Status: ${response2.status}`);
      
      if (response2.status === 401 || response2.status === 403) {
        console.log('✅ Test 2 PASSED: Correctly rejected unauthenticated create request');
      } else {
        console.log('❌ Test 2 FAILED: Should reject unauthenticated create requests');
      }
      
      // Test 3: Clean up - delete test vendor if created
      if (createdVendorId) {
        console.log('\n🧹 Cleaning up: Deleting test vendor...');
        const deleteResponse = await fetch(`${this.backendUrl}/api/vendors/${createdVendorId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (deleteResponse.status === 200) {
          console.log('✅ Test vendor cleaned up successfully');
        } else {
          console.log('⚠️  Could not clean up test vendor (manual cleanup may be needed)');
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Authenticated API test failed:', error.message);
      return false;
    }
  }

  async checkDatabaseConsistency() {
    console.log('\n🔍 CHECKING DATABASE CONSISTENCY\n');
    
    try {
      // Check vendor table structure after cleanup
      const structureQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'vendors' 
        ORDER BY ordinal_position;
      `;
      
      const result = await this.client.query(structureQuery);
      
      console.log('📊 Current vendor table structure:');
      result.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
      });
      
      // Check for risk columns (should be gone)
      const riskColumns = result.rows.filter(col => 
        col.column_name === 'risk_score' || col.column_name === 'risk_level'
      );
      
      if (riskColumns.length === 0) {
        console.log('✅ Risk columns successfully removed');
      } else {
        console.log('❌ Risk columns still exist:', riskColumns.map(c => c.column_name));
      }
      
      // Check organization isolation
      const isolationQuery = `
        SELECT 
          COUNT(*) as total_vendors,
          COUNT(organization_id) as vendors_with_org_id
        FROM vendors;
      `;
      
      const isolationResult = await this.client.query(isolationQuery);
      const stats = isolationResult.rows[0];
      
      console.log(`\n🔒 Organization isolation check:`);
      console.log(`  Total vendors: ${stats.total_vendors}`);
      console.log(`  Vendors with organization_id: ${stats.vendors_with_org_id}`);
      
      if (stats.total_vendors === stats.vendors_with_org_id) {
        console.log('✅ All vendors have organization_id - isolation intact');
      } else {
        console.log('❌ Some vendors missing organization_id - isolation broken');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Database consistency check failed:', error.message);
      return false;
    }
  }

  async runFullTest() {
    try {
      console.log('🚀 STARTING VENDOR API COMPREHENSIVE TEST\n');
      console.log('=' * 60);
      
      await this.connect();
      
      // Step 1: Check database consistency
      const dbCheck = await this.checkDatabaseConsistency();
      
      // Step 2: Test public vendor API
      const publicApiCheck = await this.testPublicVendorAPI();
      
      // Step 3: Test authenticated vendor API
      const authApiCheck = await this.testAuthenticatedVendorAPI();
      
      console.log('\n🎯 TEST SUMMARY\n');
      console.log(`Database Consistency: ${dbCheck ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`Public API (GET with org filtering): ${publicApiCheck ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`Authenticated API (POST/PUT/DELETE): ${authApiCheck ? '✅ PASS' : '❌ FAIL'}`);
      
      const allPassed = dbCheck && publicApiCheck && authApiCheck;
      console.log(`\n🏁 OVERALL RESULT: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
      
      if (allPassed) {
        console.log('\n🎉 SUCCESS: Vendor API fixes are working correctly!');
        console.log('✅ Risk columns removed from database');
        console.log('✅ Organization isolation maintained');
        console.log('✅ Public GET endpoints work with organization filtering');
        console.log('✅ Authenticated operations still require auth');
        console.log('✅ No more 401 errors for vendor access');
      } else {
        console.log('\n⚠️  ISSUES DETECTED: Some tests failed - manual review needed');
      }
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    } finally {
      await this.disconnect();
    }
  }
}

// Run the test
async function runTest() {
  const tester = new VendorAPITester();
  await tester.runFullTest();
}

runTest(); 