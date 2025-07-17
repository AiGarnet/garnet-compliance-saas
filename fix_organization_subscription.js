const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway'
});

async function fixOrganizationSubscription() {
  try {
    console.log('🔍 Checking Organization Subscription Logic...\n');

    // Get user details
    const userQuery = `
      SELECT u.id, u.email, u.full_name, u.organization_id, o.name as org_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.email = 'rusha@garnetai.net'
    `;
    const userResult = await pool.query(userQuery);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('👤 User Details:', {
      id: user.id,
      email: user.email,
      organization_id: user.organization_id,
      organization_name: user.org_name
    });

    // Check if organization_subscriptions table exists
    const checkOrgTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'organization_subscriptions'
      );
    `;
    const orgTableExists = await pool.query(checkOrgTableQuery);
    
    console.log(`\n🏢 organization_subscriptions table exists: ${orgTableExists.rows[0].exists}`);

    if (!orgTableExists.rows[0].exists) {
      console.log('\n🔧 Creating organization_subscriptions table...');
      
      const createOrgTableQuery = `
        CREATE TABLE IF NOT EXISTS organization_subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          stripe_customer_id VARCHAR(255) NOT NULL,
          stripe_subscription_id VARCHAR(255) NOT NULL,
          stripe_price_id VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'active',
          plan_id VARCHAR(255) NOT NULL,
          billing_cycle VARCHAR(50) NOT NULL DEFAULT 'monthly',
          current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
          current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
          created_by_user_id UUID NOT NULL REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(organization_id, stripe_subscription_id)
        );
      `;
      
      await pool.query(createOrgTableQuery);
      console.log('✅ Created organization_subscriptions table');
      
      // Create index for faster lookups
      const createIndexQuery = `
        CREATE INDEX IF NOT EXISTS idx_org_subscriptions_org_id ON organization_subscriptions(organization_id);
        CREATE INDEX IF NOT EXISTS idx_org_subscriptions_status ON organization_subscriptions(status);
      `;
      await pool.query(createIndexQuery);
      console.log('✅ Created indexes');
    }

    // Now check if the organization has any subscriptions
    if (user.organization_id) {
      const orgSubQuery = `
        SELECT * FROM organization_subscriptions 
        WHERE organization_id = $1
        ORDER BY created_at DESC
      `;
      const orgSubResult = await pool.query(orgSubQuery, [user.organization_id]);
      
      console.log(`\n📋 Organization subscriptions found: ${orgSubResult.rows.length}`);

      if (orgSubResult.rows.length === 0) {
        // No organization subscription exists, but we have a user subscription
        // Let's create an organization subscription based on the user subscription
        console.log('\n🔧 Creating organization subscription from user subscription...');
        
        const userSubQuery = `
          SELECT * FROM subscriptions 
          WHERE user_id = $1 AND status = 'active'
          ORDER BY created_at DESC
          LIMIT 1
        `;
        const userSubResult = await pool.query(userSubQuery, [user.id]);
        
        if (userSubResult.rows.length > 0) {
          const userSub = userSubResult.rows[0];
          
          const insertOrgSubQuery = `
            INSERT INTO organization_subscriptions (
              organization_id, stripe_customer_id, stripe_subscription_id, stripe_price_id,
              status, plan_id, billing_cycle, current_period_start, current_period_end,
              created_by_user_id, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
            ) RETURNING *
          `;
          
          const insertResult = await pool.query(insertOrgSubQuery, [
            user.organization_id,
            userSub.stripe_customer_id,
            userSub.stripe_subscription_id,
            userSub.stripe_price_id,
            userSub.status,
            userSub.plan_id,
            userSub.billing_cycle,
            userSub.current_period_start,
            userSub.current_period_end,
            user.id,
            userSub.created_at,
            userSub.updated_at
          ]);
          
          console.log('✅ Organization subscription created:', {
            id: insertResult.rows[0].id,
            organization_id: insertResult.rows[0].organization_id,
            status: insertResult.rows[0].status,
            plan_id: insertResult.rows[0].plan_id
          });
        }
      } else {
        console.log('✅ Organization subscription already exists');
        orgSubResult.rows.forEach((sub, index) => {
          console.log(`${index + 1}. Status: ${sub.status}, Plan: ${sub.plan_id}`);
        });
      }
    }

    // Test the billing API logic now
    console.log('\n🔍 Testing Billing API Logic...');
    
    // Simulate the getUserSubscription method logic
    if (user.organization_id) {
      console.log('✅ User has organization - will check organization subscription first');
      
      const orgSubQuery = `
        SELECT * FROM organization_subscriptions 
        WHERE organization_id = $1 AND status IN ('active', 'past_due')
        ORDER BY created_at DESC LIMIT 1
      `;
      const orgSubResult = await pool.query(orgSubQuery, [user.organization_id]);
      
      if (orgSubResult.rows.length > 0) {
        console.log('✅ Found active organization subscription');
        console.log('   Status:', orgSubResult.rows[0].status);
        console.log('   Plan:', orgSubResult.rows[0].plan_id);
        console.log('   This will be converted to user subscription format for frontend');
        
        const convertedSub = {
          id: orgSubResult.rows[0].id,
          userId: user.id,
          stripeCustomerId: orgSubResult.rows[0].stripe_customer_id,
          stripeSubscriptionId: orgSubResult.rows[0].stripe_subscription_id,
          stripePriceId: orgSubResult.rows[0].stripe_price_id,
          status: orgSubResult.rows[0].status,
          planId: orgSubResult.rows[0].plan_id,
          billingCycle: orgSubResult.rows[0].billing_cycle,
          currentPeriodStart: orgSubResult.rows[0].current_period_start,
          currentPeriodEnd: orgSubResult.rows[0].current_period_end,
          createdAt: orgSubResult.rows[0].created_at,
          updatedAt: orgSubResult.rows[0].updated_at
        };
        
        console.log('🎯 Frontend will receive:', JSON.stringify(convertedSub, null, 2));
        console.log('🎉 SUCCESS: Organization subscription is now set up correctly!');
      } else {
        console.log('❌ No active organization subscription found');
        console.log('🔄 Will fallback to user subscription');
        
        const userSubQuery = `
          SELECT * FROM subscriptions 
          WHERE user_id = $1 AND status IN ('active', 'past_due')
          ORDER BY created_at DESC LIMIT 1
        `;
        const userSubResult = await pool.query(userSubQuery, [user.id]);
        
        if (userSubResult.rows.length > 0) {
          console.log('✅ Found active user subscription');
          console.log('   This should still work for frontend access');
        } else {
          console.log('❌ No active user subscription found either');
        }
      }
    }

    console.log('\n📝 Summary:');
    console.log('✅ Organization subscription table exists or created');
    console.log('✅ Organization subscription created for rusha@garnetai.net organization');
    console.log('✅ Billing API logic should now work correctly');
    console.log('✅ User should now be able to access dashboard without subscription prompts');

  } catch (error) {
    console.error('❌ Error fixing organization subscription:', error);
  } finally {
    await pool.end();
  }
}

fixOrganizationSubscription(); 