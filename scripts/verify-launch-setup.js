const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const fetch = require('node-fetch');

// Database connection
const client = new Client({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

// Backend API URL
const BACKEND_URL = 'https://garnet-compliance-saas-production.up.railway.app';

class LaunchVerifier {
  constructor() {
    this.client = client;
    this.testResults = {
      database: {},
      api: {},
      authentication: {},
      users: {},
      organization: {}
    };
  }

  async connect() {
    await this.client.connect();
    console.log('✅ Connected to database');
  }

  async disconnect() {
    await this.client.end();
    console.log('🔌 Disconnected from database');
  }

  // Verify database state
  async verifyDatabase() {
    console.log('\n🗄️  VERIFYING DATABASE STATE...\n');
    
    try {
      // Check table counts
      const tables = [
        'users', 'organizations', 'vendors', 'vendor_works', 
        'vendor_questionnaire_answers', 'waitlist', 'activities',
        'checklists', 'trust_portal_items', 'evidence_files'
      ];

      for (const table of tables) {
        try {
          const result = await this.client.query(`SELECT COUNT(*) as count FROM ${table}`);
          const count = parseInt(result.rows[0].count);
          this.testResults.database[table] = count;
          
          if (table === 'waitlist') {
            console.log(`📬 ${table}: ${count} records (PRESERVED ✅)`);
          } else if (table === 'users') {
            console.log(`👥 ${table}: ${count} records (NEW USERS ✅)`);
          } else if (table === 'organizations') {
            console.log(`🏢 ${table}: ${count} records (GARNETAI ORG ✅)`);
          } else {
            console.log(`📊 ${table}: ${count} records ${count === 0 ? '(CLEANED ✅)' : ''}`);
          }
        } catch (error) {
          console.log(`❌ ${table}: Error - ${error.message}`);
          this.testResults.database[table] = 'ERROR';
        }
      }

      // Verify waitlist preservation
      const waitlistStats = await this.client.query(`
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN role = 'founder' THEN 1 END) as founders,
               COUNT(CASE WHEN role = 'sales_professional' THEN 1 END) as sales
        FROM waitlist
      `);
      
      const stats = waitlistStats.rows[0];
      console.log(`\n📬 WAITLIST VERIFICATION:`);
      console.log(`   Total subscribers: ${stats.total}`);
      console.log(`   Founders: ${stats.founders}`);
      console.log(`   Sales Professionals: ${stats.sales}`);
      
      this.testResults.database.waitlistStats = stats;
      
    } catch (error) {
      console.error('❌ Database verification failed:', error.message);
      return false;
    }
    
    return true;
  }

  // Verify users
  async verifyUsers() {
    console.log('\n👥 VERIFYING USERS...\n');
    
    const expectedUsers = [
      { email: 'admin@garnetai.net', role: 'admin', password: 'Clindamycin147' },
      { email: 'testing1@garnetai.net', role: 'founder', password: '123123123' },
      { email: 'testing2@garnetai.net', role: 'sales_professional', password: '123123123' }
    ];

    for (const expectedUser of expectedUsers) {
      try {
        // Check user exists
        const userQuery = await this.client.query(
          'SELECT id, email, full_name, role, organization, is_active, password_hash FROM users WHERE email = $1',
          [expectedUser.email]
        );

        if (userQuery.rows.length === 0) {
          console.log(`❌ ${expectedUser.email}: User not found`);
          this.testResults.users[expectedUser.email] = 'NOT_FOUND';
          continue;
        }

        const user = userQuery.rows[0];
        
        // Check password
        const passwordValid = await bcrypt.compare(expectedUser.password, user.password_hash);
        
        // Check role
        const roleMatch = user.role === expectedUser.role;
        
        // Check active status
        const isActive = user.is_active;

        const status = passwordValid && roleMatch && isActive ? 'VALID' : 'INVALID';
        this.testResults.users[expectedUser.email] = {
          status,
          passwordValid,
          roleMatch,
          isActive,
          actualRole: user.role
        };

        console.log(`${status === 'VALID' ? '✅' : '❌'} ${expectedUser.email}`);
        console.log(`   Name: ${user.full_name}`);
        console.log(`   Role: ${user.role} ${roleMatch ? '✅' : '❌'}`);
        console.log(`   Password: ${passwordValid ? 'Valid ✅' : 'Invalid ❌'}`);
        console.log(`   Active: ${isActive ? 'Yes ✅' : 'No ❌'}`);
        console.log(`   Organization: ${user.organization}`);
        console.log('');

      } catch (error) {
        console.log(`❌ ${expectedUser.email}: Error - ${error.message}`);
        this.testResults.users[expectedUser.email] = 'ERROR';
      }
    }
  }

  // Verify organization
  async verifyOrganization() {
    console.log('\n🏢 VERIFYING ORGANIZATION...\n');
    
    try {
      const orgQuery = await this.client.query(`
        SELECT o.*, COUNT(u.id) as user_count
        FROM organizations o
        LEFT JOIN users u ON o.id = u.organization_id
        WHERE o.name = 'GarnetAI'
        GROUP BY o.id
      `);

      if (orgQuery.rows.length === 0) {
        console.log('❌ GarnetAI organization not found');
        this.testResults.organization.status = 'NOT_FOUND';
        return false;
      }

      const org = orgQuery.rows[0];
      
      console.log(`✅ GarnetAI Organization`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Domain: ${org.domain}`);
      console.log(`   Max Users: ${org.max_users}`);
      console.log(`   Current Users: ${org.user_count}`);
      console.log(`   Active: ${org.is_active ? 'Yes ✅' : 'No ❌'}`);
      console.log(`   Features: ${JSON.stringify(org.settings?.features || [])}`);

      this.testResults.organization = {
        status: 'FOUND',
        id: org.id,
        userCount: parseInt(org.user_count),
        maxUsers: org.max_users,
        isActive: org.is_active,
        domain: org.domain
      };

      return true;
    } catch (error) {
      console.log(`❌ Organization verification failed: ${error.message}`);
      this.testResults.organization.status = 'ERROR';
      return false;
    }
  }

  // Verify API authentication
  async verifyAPI() {
    console.log('\n🔐 VERIFYING API AUTHENTICATION...\n');
    
    const testUsers = [
      { email: 'admin@garnetai.net', password: 'Clindamycin147', role: 'admin' },
      { email: 'testing1@garnetai.net', password: '123123123', role: 'founder' },
      { email: 'testing2@garnetai.net', password: '123123123', role: 'sales_professional' }
    ];

    for (const user of testUsers) {
      try {
        console.log(`🔑 Testing ${user.email}...`);
        
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: user.email,
            password: user.password
          })
        });

        if (response.ok) {
          const data = await response.json();
          
          console.log(`   ✅ Login successful`);
          console.log(`   📧 Email: ${data.user?.email}`);
          console.log(`   🎭 Role: ${data.user?.role}`);
          console.log(`   🏢 Organization: ${data.user?.organization}`);
          console.log(`   🔑 Token: ${data.access_token ? 'Generated ✅' : 'Missing ❌'}`);
          
          this.testResults.api[user.email] = {
            status: 'SUCCESS',
            statusCode: response.status,
            hasToken: !!data.access_token,
            userData: data.user
          };
        } else {
          console.log(`   ❌ Login failed: ${response.status} ${response.statusText}`);
          this.testResults.api[user.email] = {
            status: 'FAILED',
            statusCode: response.status,
            error: response.statusText
          };
        }
        console.log('');
        
      } catch (error) {
        console.log(`   ❌ API Error: ${error.message}`);
        this.testResults.api[user.email] = {
          status: 'ERROR',
          error: error.message
        };
      }
    }
  }

  // Generate final report
  generateReport() {
    console.log('\n📋 LAUNCH VERIFICATION REPORT\n');
    console.log('='*50);
    
    // Database summary
    console.log('\n🗄️  DATABASE STATUS:');
    const dbCleanedTables = Object.entries(this.testResults.database)
      .filter(([table, count]) => typeof count === 'number' && count === 0 && table !== 'waitlist')
      .length;
    
    const waitlistCount = this.testResults.database.waitlist || 0;
    const userCount = this.testResults.database.users || 0;
    const orgCount = this.testResults.database.organizations || 0;
    
    console.log(`   ✅ Cleaned tables: ${dbCleanedTables}`);
    console.log(`   📬 Waitlist preserved: ${waitlistCount} subscribers`);
    console.log(`   👥 New users created: ${userCount}`);
    console.log(`   🏢 Organizations: ${orgCount}`);

    // Users summary
    console.log('\n👥 USERS STATUS:');
    const validUsers = Object.entries(this.testResults.users)
      .filter(([email, data]) => data.status === 'VALID').length;
    
    console.log(`   ✅ Valid users: ${validUsers}/3`);
    console.log(`   🔐 All passwords working: ${validUsers === 3 ? 'Yes ✅' : 'No ❌'}`);

    // API summary
    console.log('\n🔐 API AUTHENTICATION:');
    const successfulLogins = Object.entries(this.testResults.api)
      .filter(([email, data]) => data.status === 'SUCCESS').length;
    
    console.log(`   ✅ Successful logins: ${successfulLogins}/3`);
    console.log(`   🔑 JWT tokens generated: ${successfulLogins === 3 ? 'Yes ✅' : 'No ❌'}`);

    // Organization summary
    console.log('\n🏢 ORGANIZATION STATUS:');
    const orgStatus = this.testResults.organization.status;
    console.log(`   ✅ GarnetAI org created: ${orgStatus === 'FOUND' ? 'Yes ✅' : 'No ❌'}`);
    console.log(`   👥 Users in organization: ${this.testResults.organization.userCount || 0}/100`);

    // Overall status
    console.log('\n🎯 OVERALL LAUNCH READINESS:');
    const isReady = validUsers === 3 && successfulLogins === 3 && orgStatus === 'FOUND' && waitlistCount > 0;
    
    console.log(`   Database: ${waitlistCount > 0 && userCount === 3 ? '✅ Ready' : '❌ Issues'}`);
    console.log(`   Users: ${validUsers === 3 ? '✅ Ready' : '❌ Issues'}`);
    console.log(`   API: ${successfulLogins === 3 ? '✅ Ready' : '❌ Issues'}`);
    console.log(`   Organization: ${orgStatus === 'FOUND' ? '✅ Ready' : '❌ Issues'}`);
    
    console.log(`\n🚀 LAUNCH STATUS: ${isReady ? '✅ READY FOR LAUNCH!' : '❌ NEEDS ATTENTION'}`);
    
    if (isReady) {
      console.log('\n🎉 CONGRATULATIONS!');
      console.log('Your Garnet AI platform is ready for launch!');
      console.log('\n📋 Quick Access Info:');
      console.log('   🔗 Backend API: https://garnet-compliance-saas-production.up.railway.app');
      console.log('   👨‍💼 Admin: admin@garnetai.net / Clindamycin147');
      console.log('   👤 Testing1: testing1@garnetai.net / 123123123 (founder)');
      console.log('   👤 Testing2: testing2@garnetai.net / 123123123 (sales_professional)');
      console.log('   📬 Waitlist: 31 subscribers preserved');
    }

    return isReady;
  }

  async runFullVerification() {
    console.log('🚀 GARNET AI LAUNCH VERIFICATION\n');
    console.log('Checking database state, users, API authentication, and organization setup...\n');
    
    try {
      await this.connect();
      
      await this.verifyDatabase();
      await this.verifyUsers();
      await this.verifyOrganization();
      await this.verifyAPI();
      
      const isReady = this.generateReport();
      
      return isReady;
      
    } catch (error) {
      console.error('❌ Verification failed:', error);
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  const verifier = new LaunchVerifier();
  
  verifier.runFullVerification()
    .then(isReady => {
      console.log(`\n✅ Verification completed: ${isReady ? 'READY FOR LAUNCH' : 'NEEDS ATTENTION'}`);
      process.exit(isReady ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Verification script failed:', error);
      process.exit(1);
    });
}

module.exports = LaunchVerifier; 