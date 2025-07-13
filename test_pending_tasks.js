const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Test 1: Check table structures
    console.log('\n🔍 Checking table structures...');
    
    const checklistQuestionsStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'checklist_questions' 
      ORDER BY ordinal_position
    `);
    console.log('checklist_questions structure:', checklistQuestionsStructure.rows);

    const vendorAnswersStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'vendor_questionnaire_answers' 
      ORDER BY ordinal_position
    `);
    console.log('vendor_questionnaire_answers structure:', vendorAnswersStructure.rows);

    const supportingDocsStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'checklist_supporting_documents' 
      ORDER BY ordinal_position
    `);
    console.log('checklist_supporting_documents structure:', supportingDocsStructure.rows);

    // Test 2: Check if we have any data
    console.log('\n📊 Checking data...');
    
    const vendorsCount = await client.query('SELECT COUNT(*) FROM vendors');
    console.log('Vendors count:', vendorsCount.rows[0].count);

    const checklistsCount = await client.query('SELECT COUNT(*) FROM checklists');
    console.log('Checklists count:', checklistsCount.rows[0].count);

    const questionsCount = await client.query('SELECT COUNT(*) FROM checklist_questions');
    console.log('Questions count:', questionsCount.rows[0].count);

    // Test 3: Get a sample organization ID
    const orgResult = await client.query('SELECT DISTINCT organization_id FROM vendors LIMIT 1');
    if (orgResult.rows.length === 0) {
      console.log('❌ No organizations found');
      return;
    }
    
    const organizationId = orgResult.rows[0].organization_id;
    console.log('Testing with organization ID:', organizationId);

    // Test 4: Test the vendors query
    console.log('\n🧪 Testing vendors query...');
    try {
      const vendorsQuery = `
        SELECT vendor_id, uuid, company_name 
        FROM vendors 
        WHERE organization_id = $1
      `;
      const vendorsResult = await client.query(vendorsQuery, [organizationId]);
      console.log('Vendors result:', vendorsResult.rows);
    } catch (error) {
      console.error('❌ Vendors query failed:', error.message);
    }

    // Test 5: Test the checklists query
    console.log('\n🧪 Testing checklists query...');
    try {
      const checklistsQuery = `
        SELECT c.id, c.vendor_id, c.name, c.question_count, c.extraction_status, v.company_name, v.vendor_id as vendor_numeric_id
        FROM checklists c
        INNER JOIN vendors v ON c.vendor_id = v.uuid
        WHERE v.organization_id = $1
        ORDER BY c.created_at DESC
      `;
      const checklistsResult = await client.query(checklistsQuery, [organizationId]);
      console.log('Checklists result:', checklistsResult.rows);
    } catch (error) {
      console.error('❌ Checklists query failed:', error.message);
    }

    // Test 6: Test the problematic questions query
    console.log('\n🧪 Testing questions query...');
    
    // First get a checklist ID
    const checklistResult = await client.query(`
      SELECT c.id FROM checklists c
      INNER JOIN vendors v ON c.vendor_id = v.uuid
      WHERE v.organization_id = $1
      LIMIT 1
    `, [organizationId]);
    
    if (checklistResult.rows.length > 0) {
      const checklistId = checklistResult.rows[0].id;
      console.log('Testing with checklist ID:', checklistId);
      
      try {
        const questionsQuery = `
          SELECT 
            cq.id,
            cq.question_text,
            vqa.answer,
            vqa.status,
            cq.requires_document,
            CASE WHEN COUNT(csd.id) > 0 THEN true ELSE false END as has_documents,
            CASE WHEN tpi.id IS NOT NULL THEN true ELSE false END as sent_to_trust_portal
          FROM checklist_questions cq
                     LEFT JOIN vendor_questionnaire_answers vqa ON cq.id::text = vqa.question_id
           LEFT JOIN checklist_supporting_documents csd ON cq.id = csd.question_id
          LEFT JOIN trust_portal_items tpi ON tpi.content LIKE '%' || cq.id::text || '%' AND tpi.is_questionnaire_answer = true
          WHERE cq.checklist_id = $1
          GROUP BY cq.id, cq.question_text, vqa.answer, vqa.status, cq.requires_document, tpi.id
          ORDER BY cq.question_order
        `;
        const questionsResult = await client.query(questionsQuery, [checklistId]);
        console.log('✅ Questions query successful:', questionsResult.rows);
      } catch (error) {
        console.error('❌ Questions query failed:', error.message);
        console.error('Error details:', error);
      }
    } else {
      console.log('No checklists found for testing');
    }

    // Test 7: Test standalone documents query
    console.log('\n🧪 Testing standalone documents query...');
    try {
      const standaloneDocsQuery = `
        SELECT csd.id, csd.filename, csd.vendor_id, v.company_name, v.vendor_id as vendor_numeric_id,
               CASE WHEN tpi.id IS NOT NULL THEN true ELSE false END as sent_to_trust_portal
        FROM checklist_supporting_documents csd
        INNER JOIN vendors v ON csd.vendor_id = v.uuid
        LEFT JOIN trust_portal_items tpi ON tpi.content LIKE '%' || csd.id::text || '%' AND tpi.is_questionnaire_answer = false
        WHERE v.organization_id = $1 AND csd.question_id IS NULL
        ORDER BY csd.created_at DESC
      `;
      const standaloneDocsResult = await client.query(standaloneDocsQuery, [organizationId]);
      console.log('✅ Standalone documents query successful:', standaloneDocsResult.rows);
    } catch (error) {
      console.error('❌ Standalone documents query failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await client.end();
  }
}

testDatabase(); 