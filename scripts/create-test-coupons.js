const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway';

async function createTestCoupons() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get admin user ID
    const adminQuery = 'SELECT id FROM users WHERE email = $1 LIMIT 1';
    const adminResult = await client.query(adminQuery, ['admin@garnetai.net']);
    
    if (adminResult.rows.length === 0) {
      console.log('Admin user not found, using default UUID');
    }

    const adminId = adminResult.rows[0]?.id || '00000000-0000-0000-0000-000000000000';

    const testCoupons = [
      {
        code: 'BACKDOOR-TEST-2024',
        name: 'Full Access Testing Coupon',
        description: 'Backdoor coupon for testing - grants access to all features with no limits',
        permissions: {
          full_access: true,
          bypass_subscription: true,
          testing_access: true,
          unlimited_questionnaires: true,
          unlimited_vendors: true,
          unlimited_users: true,
          unlimited_storage: true,
          unlimited_frameworks: true,
          plan_override: 'enterprise'
        },
        usage_limit: 1000,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        created_by: adminId
      },
      {
        code: 'DEMO-2024',
        name: 'Demo Access Coupon',
        description: 'Coupon for demonstrations - gives 30 days of Growth plan access',
        permissions: {
          plan_override: 'growth',
          testing_access: true
        },
        usage_limit: 50,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        created_by: adminId
      },
      {
        code: 'STARTUP-FREE',
        name: 'Startup Free Trial',
        description: 'Extended free trial for startups - Scale plan for 90 days',
        permissions: {
          plan_override: 'scale',
          testing_access: false
        },
        usage_limit: 100,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
        created_by: adminId
      }
    ];

    for (const coupon of testCoupons) {
      try {
        const insertQuery = `
          INSERT INTO coupons (
            code, name, description, permissions, usage_limit, 
            valid_from, valid_until, created_by, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            permissions = EXCLUDED.permissions,
            usage_limit = EXCLUDED.usage_limit,
            valid_from = EXCLUDED.valid_from,
            valid_until = EXCLUDED.valid_until,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `;

        const values = [
          coupon.code,
          coupon.name,
          coupon.description,
          JSON.stringify(coupon.permissions),
          coupon.usage_limit,
          coupon.valid_from,
          coupon.valid_until,
          coupon.created_by
        ];

        const result = await client.query(insertQuery, values);
        const createdCoupon = result.rows[0];
        
        console.log(`✅ Created/Updated coupon: ${createdCoupon.code}`);
        console.log(`   Name: ${createdCoupon.name}`);
        console.log(`   Valid until: ${createdCoupon.valid_until?.toLocaleDateString() || 'Never'}`);
        console.log(`   Usage limit: ${createdCoupon.usage_limit || 'Unlimited'}`);
        console.log('');
        
      } catch (error) {
        console.error(`❌ Error creating coupon ${coupon.code}:`, error.message);
      }
    }

    console.log('✅ Test coupons setup complete!');
    console.log('\n📋 Available Test Coupons:');
    console.log('1. BACKDOOR-TEST-2024 - Full access for testing');
    console.log('2. DEMO-2024 - Growth plan for demos');
    console.log('3. STARTUP-FREE - Scale plan for startups');
    console.log('\n💡 Use these codes in the "Apply Coupon Code" interface');

  } catch (error) {
    console.error('Error setting up test coupons:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

createTestCoupons(); 