const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const { cleanDatabase } = require('./clean-database');
const { setupUsers } = require('./setup-users');

// Database connection using the provided credentials
const client = new Client({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

class DatabaseManager {
  constructor() {
    this.client = client;
  }

  async connect() {
    if (!this.client._connected) {
      await this.client.connect();
      console.log('✅ Connected to database');
    }
  }

  async disconnect() {
    if (this.client._connected) {
      await this.client.end();
      console.log('🔌 Disconnected from database');
    }
  }

  // Check database health and show current state
  async checkDatabaseHealth() {
    try {
      await this.connect();
      console.log('🏥 Database Health Check');
      console.log('========================');

      // Check connection
      const timeResult = await this.client.query('SELECT NOW() as current_time');
      console.log(`⏰ Database time: ${timeResult.rows[0].current_time}`);

      // Check all tables and their record counts
      const tablesQuery = `
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename;
      `;
      
      const tablesResult = await this.client.query(tablesQuery);
      const tables = tablesResult.rows.map(row => row.tablename);
      
      console.log(`\n📊 Table Status (${tables.length} tables):`);
      for (const table of tables) {
        try {
          const countResult = await this.client.query(`SELECT COUNT(*) as count FROM "${table}"`);
          const count = countResult.rows[0].count;
          console.log(`  ${table}: ${count} records`);
        } catch (error) {
          console.log(`  ${table}: Error - ${error.message}`);
        }
      }

      // Check specific important tables
      console.log('\n👥 Users Summary:');
      try {
        const usersQuery = `
          SELECT email, full_name, role, organization, is_active, created_at
          FROM users 
          ORDER BY created_at DESC;
        `;
        const usersResult = await this.client.query(usersQuery);
        
        if (usersResult.rows.length > 0) {
          usersResult.rows.forEach(user => {
            console.log(`  📧 ${user.email} (${user.role}) - ${user.full_name} [${user.is_active ? 'Active' : 'Inactive'}]`);
          });
        } else {
          console.log('  No users found');
        }
      } catch (error) {
        console.log(`  Error checking users: ${error.message}`);
      }

      console.log('\n📬 Waitlist Summary:');
      try {
        const waitlistQuery = `
          SELECT COUNT(*) as total, 
                 COUNT(CASE WHEN role = 'founder' THEN 1 END) as founders,
                 COUNT(CASE WHEN role = 'sales_professional' THEN 1 END) as sales
          FROM waitlist;
        `;
        const waitlistResult = await this.client.query(waitlistQuery);
        const stats = waitlistResult.rows[0];
        console.log(`  Total subscribers: ${stats.total}`);
        console.log(`  Founders: ${stats.founders}`);
        console.log(`  Sales Professionals: ${stats.sales}`);
      } catch (error) {
        console.log(`  Error checking waitlist: ${error.message}`);
      }

    } finally {
      await this.disconnect();
    }
  }

  // Get user by email
  async getUserByEmail(email) {
    try {
      await this.connect();
      const query = `
        SELECT u.*, o.name as organization_name
        FROM users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        WHERE u.email = $1;
      `;
      const result = await this.client.query(query, [email.toLowerCase()]);
      return result.rows[0] || null;
    } finally {
      await this.disconnect();
    }
  }

  // Test login credentials
  async testLogin(email, password) {
    try {
      await this.connect();
      console.log(`🔐 Testing login for: ${email}`);
      
      const user = await this.client.query(
        'SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (user.rows.length === 0) {
        console.log('❌ User not found');
        return false;
      }

      const userData = user.rows[0];
      const isPasswordValid = await bcrypt.compare(password, userData.password_hash);
      
      if (!isPasswordValid) {
        console.log('❌ Invalid password');
        return false;
      }

      if (!userData.is_active) {
        console.log('❌ Account is inactive');
        return false;
      }

      console.log('✅ Login successful');
      console.log(`   Name: ${userData.full_name}`);
      console.log(`   Role: ${userData.role}`);
      return true;

    } catch (error) {
      console.error('❌ Login test error:', error.message);
      return false;
    } finally {
      await this.disconnect();
    }
  }

  // Update user password
  async updateUserPassword(email, newPassword) {
    try {
      await this.connect();
      console.log(`🔑 Updating password for: ${email}`);
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const result = await this.client.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2 RETURNING email, full_name',
        [hashedPassword, email.toLowerCase()]
      );

      if (result.rows.length > 0) {
        console.log(`✅ Password updated for ${result.rows[0].full_name}`);
        return true;
      } else {
        console.log('❌ User not found');
        return false;
      }

    } catch (error) {
      console.error('❌ Password update error:', error.message);
      return false;
    } finally {
      await this.disconnect();
    }
  }

  // Clean and setup database (full reset)
  async fullReset() {
    console.log('🔄 Starting full database reset...');
    console.log('This will clean all data except waitlist and create new users');
    
    try {
      // Step 1: Clean database
      console.log('\n📋 Step 1: Cleaning database...');
      await cleanDatabase();
      
      // Step 2: Setup users
      console.log('\n📋 Step 2: Setting up users...');
      await setupUsers();
      
      console.log('\n🎉 Full database reset completed successfully!');
      
      // Step 3: Verify setup
      console.log('\n📋 Step 3: Verifying setup...');
      await this.checkDatabaseHealth();
      
    } catch (error) {
      console.error('❌ Full reset failed:', error);
      throw error;
    }
  }

  // Show organizations
  async showOrganizations() {
    try {
      await this.connect();
      console.log('🏢 Organizations:');
      
      const orgQuery = `
        SELECT o.*, 
               COUNT(u.id) as user_count
        FROM organizations o
        LEFT JOIN users u ON o.id = u.organization_id
        GROUP BY o.id, o.name
        ORDER BY o.created_at;
      `;
      
      const result = await this.client.query(orgQuery);
      
      if (result.rows.length > 0) {
        result.rows.forEach(org => {
          console.log(`  🏢 ${org.name}`);
          console.log(`     ID: ${org.id}`);
          console.log(`     Domain: ${org.domain || 'N/A'}`);
          console.log(`     Users: ${org.user_count}/${org.max_users}`);
          console.log(`     Active: ${org.is_active}`);
          console.log('');
        });
      } else {
        console.log('  No organizations found');
      }
    } finally {
      await this.disconnect();
    }
  }

  // Execute custom query (for debugging)
  async executeQuery(query, params = []) {
    try {
      await this.connect();
      const result = await this.client.query(query, params);
      return result;
    } finally {
      await this.disconnect();
    }
  }
}

// CLI interface when script is run directly
async function main() {
  const manager = new DatabaseManager();
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'health':
      case 'check':
        await manager.checkDatabaseHealth();
        break;
        
      case 'clean':
        await cleanDatabase();
        break;
        
      case 'setup':
        await setupUsers();
        break;
        
      case 'reset':
      case 'full-reset':
        await manager.fullReset();
        break;
        
      case 'login':
        if (args.length < 3) {
          console.log('Usage: node database-manager.js login <email> <password>');
          process.exit(1);
        }
        await manager.testLogin(args[1], args[2]);
        break;
        
      case 'password':
        if (args.length < 3) {
          console.log('Usage: node database-manager.js password <email> <new-password>');
          process.exit(1);
        }
        await manager.updateUserPassword(args[1], args[2]);
        break;
        
      case 'user':
        if (args.length < 2) {
          console.log('Usage: node database-manager.js user <email>');
          process.exit(1);
        }
        const user = await manager.getUserByEmail(args[1]);
        if (user) {
          console.log('👤 User Details:');
          console.log(`   Email: ${user.email}`);
          console.log(`   Name: ${user.full_name}`);
          console.log(`   Role: ${user.role}`);
          console.log(`   Organization: ${user.organization_name || user.organization}`);
          console.log(`   Active: ${user.is_active}`);
          console.log(`   Created: ${user.created_at}`);
        } else {
          console.log('❌ User not found');
        }
        break;
        
      case 'orgs':
      case 'organizations':
        await manager.showOrganizations();
        break;
        
      default:
        console.log('🔧 Database Manager - Available Commands:');
        console.log('');
        console.log('  health           - Check database health and show current state');
        console.log('  clean            - Clean all tables except waitlist');
        console.log('  setup            - Create required users and organization');
        console.log('  reset            - Full reset (clean + setup)');
        console.log('  login <email> <password>  - Test login credentials');
        console.log('  password <email> <new-password>  - Update user password');
        console.log('  user <email>     - Show user details');
        console.log('  orgs             - Show all organizations');
        console.log('');
        console.log('Examples:');
        console.log('  node database-manager.js health');
        console.log('  node database-manager.js reset');
        console.log('  node database-manager.js login admin@garnetai.net Clindamycin147');
        console.log('  node database-manager.js user testing1@garnetai.net');
        break;
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main().then(() => {
    console.log('✅ Command completed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Command failed:', error);
    process.exit(1);
  });
}

module.exports = DatabaseManager; 