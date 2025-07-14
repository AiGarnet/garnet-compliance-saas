const fetch = require('node-fetch');

const BACKEND_URL = 'https://garnet-compliance-saas-production.up.railway.app';

class ActivityDebugger {
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
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      return false;
    }
  }

  async checkSystemHealth() {
    try {
      console.log('\n🔍 Checking system health and database...');
      
      const response = await fetch(`${BACKEND_URL}/api/admin/system/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status} ${response.statusText}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ System Health:', data);
      return true;
    } catch (error) {
      console.error('❌ System health check failed:', error.message);
      return false;
    }
  }

  async testActivityAnalyticsWithDetails() {
    try {
      console.log('\n📊 Testing Activity Analytics with detailed error...');
      
      const response = await fetch(`${BACKEND_URL}/api/admin/analytics/activities?days=30`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      console.log(`Response status: ${response.status}`);
      console.log(`Response headers:`, response.headers.raw());

      const responseText = await response.text();
      console.log(`Response body: ${responseText}`);

      if (!response.ok) {
        console.log('❌ Activity Analytics failed');
        try {
          const errorData = JSON.parse(responseText);
          console.log('Error details:', errorData);
        } catch (e) {
          console.log('Could not parse error as JSON');
        }
        return false;
      }

      const data = JSON.parse(responseText);
      console.log('✅ Activity Analytics successful:', data);
      return true;
    } catch (error) {
      console.error('❌ Activity Analytics test crashed:', error.message);
      return false;
    }
  }

  async testRecentActivities() {
    try {
      console.log('\n⚡ Testing Recent Activities...');
      
      const response = await fetch(`${BACKEND_URL}/api/admin/activities/recent`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status} ${response.statusText}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Recent Activities Response:', data);
      return true;
    } catch (error) {
      console.error('❌ Recent Activities failed:', error.message);
      return false;
    }
  }

  async runDebug() {
    console.log('🔍 ACTIVITY ANALYTICS DEBUGGING\n');

    // Authenticate
    const authSuccess = await this.authenticate();
    if (!authSuccess) {
      console.log('\n❌ Cannot proceed without authentication');
      return false;
    }

    // Check system health
    await this.checkSystemHealth();

    // Test recent activities (simpler endpoint)
    await this.testRecentActivities();

    // Test activity analytics with detailed logging
    await this.testActivityAnalyticsWithDetails();

    console.log('\n🏁 Debug session completed');
  }
}

// Run debug if this file is executed directly
if (require.main === module) {
  const debug = new ActivityDebugger();
  
  debug.runDebug()
    .then(() => {
      console.log('\n✅ Debug completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Debug crashed:', error);
      process.exit(1);
    });
}

module.exports = ActivityDebugger; 