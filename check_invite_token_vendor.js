const { Client } = require('pg');

// Database connection configuration
const connectionString = 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway';

async function checkInviteToken() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database successfully!');
    
    const token = '1752213296666_ww369dkf4';
    console.log(`🔍 Checking invite token: ${token}`);
    console.log('-'.repeat(50));
    
    // Find vendor by invite token
    const tokenQuery = `
      SELECT 
        vit.token,
        vit.vendor_id,
        vit.expires_at,
        vit.created_at,
        v.uuid,
        v.company_name,
        v.status
      FROM vendor_invite_tokens vit
      JOIN vendors v ON vit.vendor_id = v.vendor_id
      WHERE vit.token = $1
    `;
    
    const tokenResult = await client.query(tokenQuery, [token]);
    
    if (tokenResult.rows.length === 0) {
      console.log('❌ Invite token not found in database');
      return;
    }
    
    const tokenData = tokenResult.rows[0];
    console.log('✅ Found invite token:');
    console.log(`   Vendor ID: ${tokenData.vendor_id}`);
    console.log(`   Vendor UUID: ${tokenData.uuid}`);
    console.log(`   Company: ${tokenData.company_name}`);
    console.log(`   Status: ${tokenData.status}`);
    console.log(`   Token Created: ${tokenData.created_at}`);
    console.log(`   Expires: ${tokenData.expires_at}`);
    
    // Check trust portal items for this vendor
    console.log('\n📋 Trust Portal Items:');
    const itemsQuery = `
      SELECT 
        id,
        title,
        category,
        is_questionnaire_answer,
        questionnaire_id,
        LENGTH(content) as content_length,
        created_at
      FROM trust_portal_items
      WHERE vendor_id = $1
      ORDER BY created_at DESC
    `;
    
    const itemsResult = await client.query(itemsQuery, [tokenData.vendor_id]);
    
    if (itemsResult.rows.length > 0) {
      console.log(`Found ${itemsResult.rows.length} trust portal items:`);
      itemsResult.rows.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title}`);
        console.log(`     Category: ${item.category}`);
        console.log(`     Is Questionnaire: ${item.is_questionnaire_answer}`);
        console.log(`     Content Length: ${item.content_length} chars`);
        console.log(`     Created: ${item.created_at}`);
        
        if (item.is_questionnaire_answer && item.content_length > 100) {
          console.log('     📄 This item contains questionnaire data that should be parsed!');
        }
        console.log('');
      });
    } else {
      console.log('❌ No trust portal items found');
    }
    
    // Check if this vendor has questionnaire answers
    console.log('📝 Questionnaire Answers:');
    const answersQuery = `
      SELECT COUNT(*) as total_count,
             COUNT(*) FILTER (WHERE share_to_trust_portal = true) as shared_count
      FROM vendor_questionnaire_answers
      WHERE vendor_id = $1
    `;
    
    const answersResult = await client.query(answersQuery, [tokenData.vendor_id]);
    const answerData = answersResult.rows[0];
    console.log(`   Total answers: ${answerData.total_count}`);
    console.log(`   Shared to trust portal: ${answerData.shared_count}`);
    
    // Check evidence files
    console.log('\n📎 Evidence Files:');
    const evidenceQuery = `
      SELECT COUNT(*) as count
      FROM evidence_files
      WHERE vendor_id = $1
    `;
    
    const evidenceResult = await client.query(evidenceQuery, [tokenData.uuid]);
    console.log(`   Evidence files: ${evidenceResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

checkInviteToken(); 