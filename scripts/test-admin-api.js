const fetch = require('node-fetch');

const BACKEND_URL = 'https://garnet-compliance-saas-production.up.railway.app';

class AdminAPITester {
  constructor() {
    this.authToken = null;
    this.adminCredentials = {
      email: 'admin@garnetai.net',
      password: 'Clindamycin147'
    };
  }

  async authenticate() {
    try {
      console.log('🔐 Authenticating admin user...');
      
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.adminCredentials)
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.authToken = data.access_token;
      
      console.log('✅ Authentication successful');
      console.log(`   Admin: ${data.user.email} (${data.user.role})`);
      console.log(`   Organization: ${data.user.organization}`);
      
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      return false;
    }
  }

  async makeAPICall(endpoint, method = 'GET', body = null) {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        }
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status} ${response.statusText}: ${errorText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testDashboardOverview() {
    console.log('\n📊 Testing Admin Dashboard Overview...');
    
    const result = await this.makeAPICall('/api/admin/dashboard');
    
    if (result.success) {
      console.log('✅ Dashboard overview loaded successfully');
      console.log(`   Total Users: ${result.data.overview.totalUsers}`);
      console.log(`   Total Vendors: ${result.data.overview.totalVendors}`);
      console.log(`   Total Organizations: ${result.data.overview.totalOrganizations}`);
      console.log(`   Waitlist Subscribers: ${result.data.overview.waitlistSubscribers}`);
      console.log(`   Recent Activities: ${result.data.overview.recentActivities}`);
    } else {
      console.log('❌ Dashboard overview failed:', result.error);
    }
    
    return result.success;
  }

  async testUserManagement() {
    console.log('\n👥 Testing User Management...');
    
    const result = await this.makeAPICall('/api/admin/users');
    
    if (result.success) {
      console.log('✅ User list loaded successfully');
      console.log(`   Total Users Found: ${result.data.users.length}`);
      
      result.data.users.forEach(user => {
        console.log(`   📧 ${user.email} (${user.role}) - ${user.full_name} [${user.is_active ? 'Active' : 'Inactive'}]`);
      });
    } else {
      console.log('❌ User management failed:', result.error);
    }
    
    return result.success;
  }

  async testVendorManagement() {
    console.log('\n🏢 Testing Vendor Management...');
    
    const result = await this.makeAPICall('/api/admin/vendors');
    
    if (result.success) {
      console.log('✅ Vendor list loaded successfully');
      console.log(`   Total Vendors Found: ${result.data.vendors.length}`);
      
      result.data.vendors.forEach(vendor => {
        console.log(`   🏢 ${vendor.company_name} (${vendor.status}) - Org: ${vendor.organization_name || 'N/A'}`);
      });
    } else {
      console.log('❌ Vendor management failed:', result.error);
    }
    
    return result.success;
  }

  async testOrganizationManagement() {
    console.log('\n🏛️ Testing Organization Management...');
    
    const result = await this.makeAPICall('/api/admin/organizations');
    
    if (result.success) {
      console.log('✅ Organization list loaded successfully');
      console.log(`   Total Organizations Found: ${result.data.organizations.length}`);
      
      result.data.organizations.forEach(org => {
        console.log(`   🏛️ ${org.name} - Users: ${org.user_count}/${org.max_users} - Domain: ${org.domain || 'N/A'}`);
      });
    } else {
      console.log('❌ Organization management failed:', result.error);
    }
    
    return result.success;
  }

  async testAnalytics() {
    console.log('\n📈 Testing Analytics...');
    
    const endpoints = [
      { path: '/api/admin/analytics/users', name: 'User Analytics' },
      { path: '/api/admin/analytics/vendors', name: 'Vendor Analytics' },
      { path: '/api/admin/analytics/activities', name: 'Activity Analytics' },
      { path: '/api/admin/analytics/waitlist', name: 'Waitlist Analytics' }
    ];

    let successCount = 0;

    for (const endpoint of endpoints) {
      const result = await this.makeAPICall(endpoint.path);
      
      if (result.success) {
        console.log(`   ✅ ${endpoint.name}: Success`);
        successCount++;
      } else {
        console.log(`   ❌ ${endpoint.name}: ${result.error}`);
      }
    }

    console.log(`📊 Analytics Results: ${successCount}/${endpoints.length} endpoints working`);
    return successCount === endpoints.length;
  }

  async testSystemHealth() {
    console.log('\n⚙️ Testing System Health...');
    
    const result = await this.makeAPICall('/api/admin/system/health');
    
    if (result.success) {
      console.log('✅ System health check successful');
      console.log(`   Database Status: ${result.data.database.status}`);
      console.log(`   Active Connections: ${result.data.database.activeConnections}`);
      console.log(`   Database Time: ${result.data.database.currentTime}`);
    } else {
      console.log('❌ System health check failed:', result.error);
    }
    
    return result.success;
  }

  async testRecentActivities() {
    console.log('\n⚡ Testing Recent Activities...');
    
    const result = await this.makeAPICall('/api/admin/activities/recent');
    
    if (result.success) {
      console.log('✅ Recent activities loaded successfully');
      console.log(`   Activities Found: ${result.data.activities.length}`);
      
      result.data.activities.slice(0, 5).forEach(activity => {
        console.log(`   ⚡ ${activity.type}: ${activity.description} (${activity.user_name || 'System'})`);
      });
    } else {
      console.log('❌ Recent activities failed:', result.error);
    }
    
    return result.success;
  }

  async runAllTests() {
    console.log('🚀 ADMIN API TESTING SUITE\n');
    console.log('Testing all admin endpoints with proper authentication...\n');

    // Authenticate first
    const authSuccess = await this.authenticate();
    if (!authSuccess) {
      console.log('\n❌ Cannot proceed without authentication');
      return false;
    }

    // Run all tests
    const tests = [
      { name: 'Dashboard Overview', test: () => this.testDashboardOverview() },
      { name: 'User Management', test: () => this.testUserManagement() },
      { name: 'Vendor Management', test: () => this.testVendorManagement() },
      { name: 'Organization Management', test: () => this.testOrganizationManagement() },
      { name: 'Analytics', test: () => this.testAnalytics() },
      { name: 'System Health', test: () => this.testSystemHealth() },
      { name: 'Recent Activities', test: () => this.testRecentActivities() }
    ];

    let passedTests = 0;
    const totalTests = tests.length;

    for (const test of tests) {
      try {
        const success = await test.test();
        if (success) passedTests++;
      } catch (error) {
        console.log(`❌ ${test.name} test crashed:`, error.message);
      }
    }

    // Summary
    console.log('\n📋 ADMIN API TEST SUMMARY');
    console.log('==========================');
    console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Tests Failed: ${totalTests - passedTests}/${totalTests}`);
    console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (passedTests === totalTests) {
      console.log('\n🎉 ALL ADMIN APIs ARE WORKING CORRECTLY!');
      console.log('The admin dashboard should be fully functional.');
    } else {
      console.log('\n⚠️  Some admin APIs need attention.');
      console.log('Check the errors above for details.');
    }

    return passedTests === totalTests;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new AdminAPITester();
  
  tester.runAllTests()
    .then(allPassed => {
      console.log(`\n✅ Testing completed: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
      process.exit(allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test suite crashed:', error);
      process.exit(1);
    });
}

module.exports = AdminAPITester; 