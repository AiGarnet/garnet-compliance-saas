const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: { rejectUnauthorized: false }
});

async function debugTrustPortal() {
  try {
    await client.connect();
    console.log('🔍 Connected to database for debugging...\n');

    // 1. First, check what vendors exist
    console.log('📋 Checking all vendors in database...');
    const allVendorsQuery = `
      SELECT vendor_id, uuid, company_name, created_at 
      FROM vendors 
      ORDER BY created_at DESC
      LIMIT 10
    `;
    const allVendorsResult = await client.query(allVendorsQuery);
    
    console.log(`Found ${allVendorsResult.rows.length} vendors:`);
    allVendorsResult.rows.forEach((vendor, index) => {
      console.log(`  ${index + 1}. ${vendor.company_name || 'Unnamed'}`);
      console.log(`     - Numeric ID: ${vendor.vendor_id}`);
      console.log(`     - UUID: ${vendor.uuid}`);
      console.log(`     - Created: ${vendor.created_at}`);
    });

    if (allVendorsResult.rows.length === 0) {
      console.log('❌ No vendors found in database!');
      return;
    }

    // Use the first vendor for testing
    const testVendor = allVendorsResult.rows[0];
    console.log(`\n🎯 Using vendor for testing: ${testVendor.company_name} (${testVendor.uuid})`);

    // 2. Check trust portal items for this vendor
    console.log('\n🏛️ Checking trust portal items...');
    const trustPortalQuery = `
      SELECT 
        id, title, description, category, 
        is_questionnaire_answer, questionnaire_id,
        LENGTH(content) as content_length,
        created_at
      FROM trust_portal_items 
      WHERE vendor_id = $1
      ORDER BY created_at DESC
    `;
    const trustPortalResult = await client.query(trustPortalQuery, [testVendor.vendor_id]);
    
    console.log(`📊 Found ${trustPortalResult.rows.length} trust portal items`);
    
    if (trustPortalResult.rows.length === 0) {
      console.log('❌ No trust portal items found for this vendor');
      console.log('💡 This means no checklists have been sent to trust portal yet');
      
      // Check if there are checklists for this vendor
      console.log('\n📋 Checking if vendor has any checklists...');
      const checklistQuery = `
        SELECT id, name, extraction_status, question_count, created_at
        FROM checklists 
        WHERE vendor_id = $1
        ORDER BY created_at DESC
      `;
      const checklistResult = await client.query(checklistQuery, [testVendor.uuid]);
      console.log(`Found ${checklistResult.rows.length} checklists for this vendor`);
      
      if (checklistResult.rows.length > 0) {
        checklistResult.rows.forEach((checklist, index) => {
          console.log(`  ${index + 1}. ${checklist.name}`);
          console.log(`     - ID: ${checklist.id}`);
          console.log(`     - Status: ${checklist.extraction_status}`);
          console.log(`     - Questions: ${checklist.question_count}`);
          console.log(`     - Created: ${checklist.created_at}`);
        });
        
        // Check if questions have AI answers for the first checklist
        const firstChecklist = checklistResult.rows[0];
        console.log(`\n🤖 Checking AI answers for checklist: ${firstChecklist.name}...`);
        const questionsQuery = `
          SELECT 
            id, question_text, status,
            (ai_answer IS NOT NULL AND ai_answer != '') as has_answer,
            CASE WHEN ai_answer IS NOT NULL AND ai_answer != '' THEN LENGTH(ai_answer) ELSE 0 END as answer_length
          FROM checklist_questions
          WHERE checklist_id = $1 AND vendor_id = $2
          ORDER BY question_order ASC
          LIMIT 5
        `;
        const questionsResult = await client.query(questionsQuery, [firstChecklist.id, testVendor.uuid]);
        
        console.log(`Found ${questionsResult.rows.length} questions (showing first 5):`);
        questionsResult.rows.forEach((question, index) => {
          console.log(`  ${index + 1}. ${question.question_text.substring(0, 50)}...`);
          console.log(`     - Status: ${question.status}`);
          console.log(`     - Has Answer: ${question.has_answer ? '✅' : '❌'}`);
          console.log(`     - Answer Length: ${question.answer_length} chars`);
        });
        
        const totalQuestionsQuery = `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE ai_answer IS NOT NULL AND ai_answer != '') as answered FROM checklist_questions WHERE checklist_id = $1`;
        const totalResult = await client.query(totalQuestionsQuery, [firstChecklist.id]);
        const totals = totalResult.rows[0];
        console.log(`\n📊 Summary for ${firstChecklist.name}:`);
        console.log(`   - Total questions: ${totals.total}`);
        console.log(`   - Questions with AI answers: ${totals.answered}`);
        console.log(`   - Ready for trust portal: ${totals.total == totals.answered ? '✅' : '❌'}`);
        
        if (totals.total == totals.answered && totals.total > 0) {
          console.log(`\n🎯 This checklist is ready to send to trust portal!`);
          console.log(`   Use checklist ID: ${firstChecklist.id}`);
          console.log(`   Use vendor UUID: ${testVendor.uuid}`);
        }
      } else {
        console.log('❌ No checklists found for this vendor');
      }
    } else {
      trustPortalResult.rows.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title}`);
        console.log(`     - Category: ${item.category}`);
        console.log(`     - Is Questionnaire: ${item.is_questionnaire_answer}`);
        console.log(`     - Questionnaire ID: ${item.questionnaire_id || 'N/A'}`);
        console.log(`     - Content Length: ${item.content_length || 0} chars`);
        console.log(`     - Created: ${item.created_at}`);
        
        if (item.is_questionnaire_answer && item.content_length > 100) {
          console.log('     ✅ This looks like a valid questionnaire submission!');
        }
      });
    }

    // 3. Check supporting documents
    console.log('\n📎 Checking supporting documents...');
    const docsQuery = `
      SELECT id, filename, question_id, created_at
      FROM checklist_supporting_documents 
      WHERE vendor_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `;
    const docsResult = await client.query(docsQuery, [testVendor.uuid]);
    console.log(`Found ${docsResult.rows.length} supporting documents`);

    // 4. Check if there are any trust portal items in the entire database
    console.log('\n🌍 Checking trust portal items in entire database...');
    const allItemsQuery = `
      SELECT COUNT(*) as total_items,
             COUNT(*) FILTER (WHERE is_questionnaire_answer = true) as questionnaire_items
      FROM trust_portal_items
    `;
    const allItemsResult = await client.query(allItemsQuery);
    const stats = allItemsResult.rows[0];
    console.log(`Total trust portal items: ${stats.total_items}`);
    console.log(`Questionnaire items: ${stats.questionnaire_items}`);

    if (stats.total_items === 0) {
      console.log('\n❌ NO TRUST PORTAL ITEMS EXIST IN THE DATABASE');
      console.log('💡 This suggests the "Send to Trust Portal" feature hasn\'t been used yet');
      console.log('🎯 To test: Upload a checklist, generate AI answers, then send to trust portal');
    }

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await client.end();
  }
}

debugTrustPortal(); 