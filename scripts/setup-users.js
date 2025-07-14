const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// Database connection using the provided credentials
const client = new Client({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupUsers() {
  try {
    console.log('👥 Starting user setup...');
    await client.connect();
    console.log('✅ Connected to database');

    // Step 1: Create GarnetAI organization
    console.log('\n🏢 Creating GarnetAI organization...');
    
    const orgQuery = `
      INSERT INTO organizations (name, domain, max_users, settings, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name;
    `;
    
    const orgValues = [
      'GarnetAI',
      'garnetai.net',
      100, // Admin can have more users
      JSON.stringify({
        features: ['compliance', 'vendors', 'questionnaires', 'analytics', 'admin'],
        theme: 'default',
        admin_access: true
      }),
      true
    ];

    const orgResult = await client.query(orgQuery, orgValues);
    const organizationId = orgResult.rows[0].id;
    const organizationName = orgResult.rows[0].name;
    
    console.log(`✅ Organization created: ${organizationName} (ID: ${organizationId})`);

    // Step 2: Create users with proper password hashing
    const users = [
      {
        email: 'admin@garnetai.net',
        password: 'Clindamycin147',
        full_name: 'Admin User',
        role: 'admin',
        organization: 'GarnetAI',
        organization_id: organizationId
      },
      {
        email: 'testing1@garnetai.net',
        password: '123123123',
        full_name: 'Testing User 1',
        role: 'founder',
        organization: 'GarnetAI',
        organization_id: organizationId
      },
      {
        email: 'testing2@garnetai.net',
        password: '123123123',
        full_name: 'Testing User 2',
        role: 'sales_professional',
        organization: 'GarnetAI',
        organization_id: organizationId
      }
    ];

    console.log('\n👤 Creating users...');

    for (const user of users) {
      try {
        // Hash password
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Insert user
        const userQuery = `
          INSERT INTO users (
            email, password_hash, full_name, role, organization, organization_id, 
            metadata, is_active, source, signup_date, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id, email, full_name, role, organization;
        `;

        const userValues = [
          user.email.toLowerCase(),
          hashedPassword,
          user.full_name,
          user.role,
          user.organization,
          user.organization_id,
          JSON.stringify({ 
            created_by: 'setup_script',
            launch_preparation: true 
          }),
          true, // is_active
          'setup_script',
          new Date(),
          new Date(),
          new Date()
        ];

        const userResult = await client.query(userQuery, userValues);
        const createdUser = userResult.rows[0];
        
        console.log(`  ✅ ${createdUser.email} (${createdUser.role}) - ${createdUser.full_name}`);
        console.log(`     ID: ${createdUser.id}`);
        console.log(`     Organization: ${createdUser.organization}`);
        
      } catch (error) {
        if (error.constraint === 'users_email_key') {
          console.log(`  ⚠️  ${user.email} already exists, skipping...`);
        } else {
          console.error(`  ❌ Error creating ${user.email}:`, error.message);
        }
      }
    }

    // Step 3: Verify created users
    console.log('\n🔍 Verifying created users...');
    
    const verifyQuery = `
      SELECT u.id, u.email, u.full_name, u.role, u.organization, u.is_active, o.name as org_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.email IN ('admin@garnetai.net', 'testing1@garnetai.net', 'testing2@garnetai.net')
      ORDER BY u.email;
    `;
    
    const verifyResult = await client.query(verifyQuery);
    
    console.log('📊 User verification results:');
    verifyResult.rows.forEach(user => {
      console.log(`  📧 ${user.email}`);
      console.log(`     👤 Name: ${user.full_name}`);
      console.log(`     🎭 Role: ${user.role}`);
      console.log(`     🏢 Organization: ${user.org_name || user.organization}`);
      console.log(`     ✅ Active: ${user.is_active}`);
      console.log(`     🆔 ID: ${user.id}`);
      console.log('');
    });

    // Step 4: Test login functionality
    console.log('🔐 Testing login functionality...');
    
    const testCredentials = [
      { email: 'admin@garnetai.net', password: 'Clindamycin147' },
      { email: 'testing1@garnetai.net', password: '123123123' },
      { email: 'testing2@garnetai.net', password: '123123123' }
    ];

    for (const creds of testCredentials) {
      try {
        const loginQuery = `
          SELECT id, email, password_hash, full_name, role, is_active 
          FROM users 
          WHERE email = $1
        `;
        
        const loginResult = await client.query(loginQuery, [creds.email]);
        
        if (loginResult.rows.length > 0) {
          const user = loginResult.rows[0];
          const isPasswordValid = await bcrypt.compare(creds.password, user.password_hash);
          
          if (isPasswordValid && user.is_active) {
            console.log(`  ✅ ${creds.email}: Login test successful`);
          } else {
            console.log(`  ❌ ${creds.email}: Login test failed (password: ${isPasswordValid}, active: ${user.is_active})`);
          }
        } else {
          console.log(`  ❌ ${creds.email}: User not found`);
        }
      } catch (error) {
        console.log(`  ❌ ${creds.email}: Login test error - ${error.message}`);
      }
    }

    console.log('\n🎉 User setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Organization: GarnetAI created');
    console.log('✅ Admin user: admin@garnetai.net (password: Clindamycin147)');
    console.log('✅ Test user 1: testing1@garnetai.net (founder, password: 123123123)');
    console.log('✅ Test user 2: testing2@garnetai.net (sales_professional, password: 123123123)');
    console.log('✅ All users are active and ready for login');

  } catch (error) {
    console.error('❌ Error during user setup:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupUsers()
    .then(() => {
      console.log('✅ User setup script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ User setup script failed:', error);
      process.exit(1);
    });
}

module.exports = { setupUsers }; 