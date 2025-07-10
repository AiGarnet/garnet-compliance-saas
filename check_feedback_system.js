const { Client } = require('pg');

// Database connection using provided credentials
const client = new Client({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway'
});

async function checkFeedbackSystem() {
  try {
    console.log('🔍 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully\n');

    // Check if feedback tables exist
    console.log('📋 Checking feedback system tables...');
    
    const tableCheckQuery = `
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name IN ('trust_portal_feedback', 'feedback_responses')
      ORDER BY table_name, ordinal_position;
    `;
    
    const tablesResult = await client.query(tableCheckQuery);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ No feedback tables found. Creating feedback tables...\n');
      await createFeedbackTables();
    } else {
      console.log('✅ Feedback tables found:');
      let currentTable = '';
      tablesResult.rows.forEach(row => {
        if (row.table_name !== currentTable) {
          currentTable = row.table_name;
          console.log(`\n📄 Table: ${row.table_name}`);
        }
        console.log(`   - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      console.log('');
    }

    // Check existing feedback data
    console.log('📊 Checking existing feedback data...');
    
    try {
      const feedbackCountQuery = `
        SELECT 
          COUNT(*) as total_feedback,
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress,
          COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) as resolved
        FROM trust_portal_feedback;
      `;
      
      const feedbackCount = await client.query(feedbackCountQuery);
      const stats = feedbackCount.rows[0];
      
      console.log(`📈 Feedback Statistics:`);
      console.log(`   Total Feedback: ${stats.total_feedback}`);
      console.log(`   Pending: ${stats.pending}`);
      console.log(`   In Progress: ${stats.in_progress}`);
      console.log(`   Resolved: ${stats.resolved}\n`);

      // Get recent feedback
      const recentFeedbackQuery = `
        SELECT 
          id,
          vendor_id,
          enterprise_contact_email,
          enterprise_company_name,
          feedback_type,
          priority,
          subject,
          status,
          created_at
        FROM trust_portal_feedback 
        ORDER BY created_at DESC 
        LIMIT 5;
      `;
      
      const recentFeedback = await client.query(recentFeedbackQuery);
      
      if (recentFeedback.rows.length > 0) {
        console.log('📝 Recent Feedback:');
        recentFeedback.rows.forEach(feedback => {
          console.log(`   ID: ${feedback.id} | Vendor: ${feedback.vendor_id} | From: ${feedback.enterprise_contact_email || 'Unknown'}`);
          console.log(`   Company: ${feedback.enterprise_company_name || 'N/A'} | Type: ${feedback.feedback_type} | Priority: ${feedback.priority}`);
          console.log(`   Subject: ${feedback.subject} | Status: ${feedback.status} | Date: ${feedback.created_at}\n`);
        });
      } else {
        console.log('📝 No feedback records found.\n');
      }

      // Check feedback responses
      const responseCountQuery = `
        SELECT COUNT(*) as total_responses
        FROM feedback_responses;
      `;
      
      const responseCount = await client.query(responseCountQuery);
      console.log(`💬 Total Feedback Responses: ${responseCount.rows[0].total_responses}\n`);

    } catch (error) {
      console.log('❌ Error checking feedback data (tables might not exist):', error.message);
      console.log('🔧 This is expected if feedback tables haven\'t been created yet.\n');
    }

    // Check vendor invite tokens
    console.log('🔑 Checking vendor invite tokens...');
    
    try {
      const inviteTokenQuery = `
        SELECT table_name, column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'vendor_invite_tokens'
        ORDER BY ordinal_position;
      `;
      
      const inviteTokenTable = await client.query(inviteTokenQuery);
      
      if (inviteTokenTable.rows.length > 0) {
        console.log('✅ Vendor invite tokens table found:');
        inviteTokenTable.rows.forEach(row => {
          console.log(`   - ${row.column_name}: ${row.data_type}`);
        });

        const activeTokensQuery = `
          SELECT 
            vendor_id,
            token,
            expires_at,
            created_at,
            CASE WHEN expires_at > NOW() THEN 'Active' ELSE 'Expired' END as status
          FROM vendor_invite_tokens 
          ORDER BY created_at DESC 
          LIMIT 10;
        `;
        
        const activeTokens = await client.query(activeTokensQuery);
        
        if (activeTokens.rows.length > 0) {
          console.log(`\n🎫 Invite Tokens (showing last 10):`);
          activeTokens.rows.forEach(token => {
            console.log(`   Vendor ID: ${token.vendor_id} | Token: ${token.token.substring(0, 8)}... | Status: ${token.status}`);
            console.log(`   Created: ${token.created_at} | Expires: ${token.expires_at}\n`);
          });
        } else {
          console.log('\n🎫 No invite tokens found.');
        }
      } else {
        console.log('❌ Vendor invite tokens table not found. Creating table...\n');
        await createInviteTokensTable();
      }
    } catch (error) {
      console.log('❌ Error checking invite tokens:', error.message);
    }

    // Test vendor lookup
    console.log('🏢 Testing vendor data access...');
    
    try {
      const vendorTestQuery = `
        SELECT vendor_id, company_name, created_at
        FROM vendors 
        ORDER BY created_at DESC 
        LIMIT 5;
      `;
      
      const vendors = await client.query(vendorTestQuery);
      
      if (vendors.rows.length > 0) {
        console.log('✅ Recent vendors:');
        vendors.rows.forEach(vendor => {
          console.log(`   ID: ${vendor.vendor_id} | Company: ${vendor.company_name} | Created: ${vendor.created_at}`);
        });
      } else {
        console.log('📭 No vendors found in database.');
      }
    } catch (error) {
      console.log('❌ Error checking vendors:', error.message);
    }

    console.log('\n🎉 Feedback system check completed!');

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.');
  }
}

async function createFeedbackTables() {
  console.log('🔧 Creating feedback tables...');
  
  try {
    // Create trust_portal_feedback table
    const createFeedbackTableQuery = `
      CREATE TABLE IF NOT EXISTS trust_portal_feedback (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER NOT NULL,
        enterprise_contact_email VARCHAR(255) NOT NULL,
        enterprise_contact_name VARCHAR(255),
        enterprise_company_name VARCHAR(255),
        feedback_type VARCHAR(50) DEFAULT 'GENERAL',
        priority VARCHAR(20) DEFAULT 'MEDIUM',
        subject VARCHAR(500) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE
      );
    `;
    
    await client.query(createFeedbackTableQuery);
    console.log('✅ Created trust_portal_feedback table');

    // Create feedback_responses table
    const createResponsesTableQuery = `
      CREATE TABLE IF NOT EXISTS feedback_responses (
        id SERIAL PRIMARY KEY,
        feedback_id INTEGER NOT NULL,
        responder_type VARCHAR(20) NOT NULL DEFAULT 'VENDOR',
        responder_name VARCHAR(255),
        responder_email VARCHAR(255),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feedback_id) REFERENCES trust_portal_feedback(id) ON DELETE CASCADE
      );
    `;
    
    await client.query(createResponsesTableQuery);
    console.log('✅ Created feedback_responses table');

    // Create indexes for better performance
    const createIndexesQuery = `
      CREATE INDEX IF NOT EXISTS idx_feedback_vendor_id ON trust_portal_feedback(vendor_id);
      CREATE INDEX IF NOT EXISTS idx_feedback_status ON trust_portal_feedback(status);
      CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON trust_portal_feedback(created_at);
      CREATE INDEX IF NOT EXISTS idx_responses_feedback_id ON feedback_responses(feedback_id);
    `;
    
    await client.query(createIndexesQuery);
    console.log('✅ Created database indexes');

  } catch (error) {
    console.error('❌ Error creating feedback tables:', error.message);
  }
}

async function createInviteTokensTable() {
  console.log('🔧 Creating vendor invite tokens table...');
  
  try {
    const createInviteTokensQuery = `
      CREATE TABLE IF NOT EXISTS vendor_invite_tokens (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE
      );
    `;
    
    await client.query(createInviteTokensQuery);
    console.log('✅ Created vendor_invite_tokens table');

    // Create indexes
    const createTokenIndexesQuery = `
      CREATE INDEX IF NOT EXISTS idx_invite_tokens_vendor_id ON vendor_invite_tokens(vendor_id);
      CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON vendor_invite_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_invite_tokens_expires_at ON vendor_invite_tokens(expires_at);
    `;
    
    await client.query(createTokenIndexesQuery);
    console.log('✅ Created invite token indexes');

  } catch (error) {
    console.error('❌ Error creating invite tokens table:', error.message);
  }
}

// Run the check
checkFeedbackSystem(); 