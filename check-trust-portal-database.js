const { Client } = require('pg');

async function checkTrustPortalDatabase() {
  const client = new Client({
    connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // 1. Check user prithvi@garnetai.net and their organization
    console.log('\n📧 Checking user prithvi@garnetai.net:');
    const userQuery = `
      SELECT 
        id, 
        email, 
        full_name, 
        role, 
        organization_id,
        organization,
        created_at
      FROM users 
      WHERE email = 'prithvi@garnetai.net'
    `;
    const userResult = await client.query(userQuery);
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log('User found:', {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        organizationId: user.organization_id,
        organization: user.organization
      });

      // 2. Check vendors for this user's organization
      if (user.organization_id) {
        console.log(`\n🏢 Checking vendors for organization ${user.organization_id}:`);
        const vendorsQuery = `
          SELECT 
            vendor_id,
            uuid,
            company_name,
            status,
            organization_id,
            created_by_user_id,
            created_at
          FROM vendors 
          WHERE organization_id = $1
          ORDER BY company_name ASC
        `;
        const vendorsResult = await client.query(vendorsQuery, [user.organization_id]);
        
        console.log(`Found ${vendorsResult.rows.length} vendors in organization:`);
        vendorsResult.rows.forEach((vendor, index) => {
          console.log(`  ${index + 1}. ${vendor.company_name} (${vendor.status}) - UUID: ${vendor.uuid}`);
        });

        // 3. Check ALL vendors to see the distribution
        console.log('\n🌍 Checking ALL vendors in database:');
        const allVendorsQuery = `
          SELECT 
            vendor_id,
            company_name,
            status,
            organization_id,
            created_at
          FROM vendors 
          ORDER BY organization_id, company_name ASC
        `;
        const allVendorsResult = await client.query(allVendorsQuery);
        
        console.log(`Total vendors in database: ${allVendorsResult.rows.length}`);
        const orgGroups = {};
        allVendorsResult.rows.forEach(vendor => {
          const orgId = vendor.organization_id || 'NO_ORG';
          if (!orgGroups[orgId]) {
            orgGroups[orgId] = [];
          }
          orgGroups[orgId].push(vendor.company_name);
        });

        Object.keys(orgGroups).forEach(orgId => {
          console.log(`  Org ${orgId}: ${orgGroups[orgId].join(', ')}`);
        });

      } else {
        console.log('❌ User has no organization_id assigned!');
      }

    } else {
      console.log('❌ User prithvi@garnetai.net not found in database');
    }

    // 4. Check organizations table
    console.log('\n🏛️ Checking organizations:');
    const orgsQuery = `
      SELECT 
        id,
        name,
        is_active,
        created_at
      FROM organizations
      ORDER BY created_at
    `;
    const orgsResult = await client.query(orgsQuery);
    console.log(`Found ${orgsResult.rows.length} organizations:`);
    orgsResult.rows.forEach((org, index) => {
      console.log(`  ${index + 1}. ${org.name} (${org.id}) - Active: ${org.is_active}`);
    });

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the check
checkTrustPortalDatabase().catch(console.error); 