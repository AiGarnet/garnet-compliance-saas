const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: { rejectUnauthorized: false }
});

async function fetchAllDatabaseData() {
  try {
    await client.connect();
    console.log('🔍 Connected to database for comprehensive analysis...\n');

    // 1. Get all tables in the database
    console.log('📊 FETCHING ALL TABLES...');
    const tablesQuery = `
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    const tablesResult = await client.query(tablesQuery);
    
    console.log(`Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.table_name} (${table.table_type})`);
    });

    console.log('\n' + '='.repeat(80) + '\n');

    // 2. For each table, get structure and sample data
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      
      console.log(`🔍 TABLE: ${tableName.toUpperCase()}`);
      console.log('-'.repeat(50));

      // Get column information
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `;
      const columnsResult = await client.query(columnsQuery, [tableName]);
      
      console.log('📋 COLUMNS:');
      columnsResult.rows.forEach((col, index) => {
        console.log(`  ${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });

      // Get row count
      const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
      const countResult = await client.query(countQuery);
      const rowCount = parseInt(countResult.rows[0].count);
      
      console.log(`\n📊 TOTAL ROWS: ${rowCount}`);

      if (rowCount > 0) {
        // Get sample data (limit to 5 rows for readability)
        const sampleQuery = `SELECT * FROM ${tableName} ORDER BY created_at DESC LIMIT 5`;
        let sampleResult;
        
        try {
          sampleResult = await client.query(sampleQuery);
        } catch (error) {
          // If no created_at column, just get first 5 rows
          try {
            const fallbackQuery = `SELECT * FROM ${tableName} LIMIT 5`;
            sampleResult = await client.query(fallbackQuery);
          } catch (fallbackError) {
            console.log('❌ Could not fetch sample data');
            continue;
          }
        }

        console.log('\n📄 SAMPLE DATA:');
        if (sampleResult.rows.length > 0) {
          sampleResult.rows.forEach((row, index) => {
            console.log(`\n  Row ${index + 1}:`);
            Object.keys(row).forEach(key => {
              let value = row[key];
              if (value === null) {
                value = 'NULL';
              } else if (typeof value === 'string' && value.length > 100) {
                value = value.substring(0, 100) + '... (truncated)';
              } else if (typeof value === 'object') {
                value = JSON.stringify(value);
                if (value.length > 100) {
                  value = value.substring(0, 100) + '... (truncated)';
                }
              }
              console.log(`    ${key}: ${value}`);
            });
          });
        }
      } else {
        console.log('❌ No data in this table');
      }

      console.log('\n' + '='.repeat(80) + '\n');
    }

    // 3. Special focus on key tables for trust portal
    console.log('🎯 SPECIAL ANALYSIS FOR TRUST PORTAL FLOW...\n');

    // Check vendors with details
    console.log('👥 VENDORS ANALYSIS:');
    const vendorsQuery = `
      SELECT vendor_id, uuid, company_name, status, industry, region, created_at,
             (SELECT COUNT(*) FROM checklists WHERE vendor_id = vendors.uuid) as checklist_count,
             (SELECT COUNT(*) FROM trust_portal_items WHERE vendor_id = vendors.vendor_id) as trust_portal_count
      FROM vendors 
      ORDER BY created_at DESC
    `;
    const vendorsResult = await client.query(vendorsQuery);
    
    vendorsResult.rows.forEach((vendor, index) => {
      console.log(`\n  ${index + 1}. ${vendor.company_name}`);
      console.log(`     - ID: ${vendor.vendor_id}, UUID: ${vendor.uuid}`);
      console.log(`     - Status: ${vendor.status}, Industry: ${vendor.industry || 'N/A'}`);
      console.log(`     - Checklists: ${vendor.checklist_count}, Trust Portal Items: ${vendor.trust_portal_count}`);
      console.log(`     - Created: ${vendor.created_at}`);
    });

    // Check checklists with questions
    console.log('\n📋 CHECKLISTS ANALYSIS:');
    const checklistsQuery = `
      SELECT c.id, c.vendor_id, c.name, c.extraction_status, c.question_count, c.created_at,
             v.company_name,
             (SELECT COUNT(*) FROM checklist_questions WHERE checklist_id = c.id) as actual_questions,
             (SELECT COUNT(*) FROM checklist_questions WHERE checklist_id = c.id AND ai_answer IS NOT NULL AND ai_answer != '') as answered_questions
      FROM checklists c
      LEFT JOIN vendors v ON c.vendor_id = v.uuid
      ORDER BY c.created_at DESC
    `;
    const checklistsResult = await client.query(checklistsQuery);
    
    if (checklistsResult.rows.length === 0) {
      console.log('❌ No checklists found');
    } else {
      checklistsResult.rows.forEach((checklist, index) => {
        console.log(`\n  ${index + 1}. ${checklist.name}`);
        console.log(`     - ID: ${checklist.id}`);
        console.log(`     - Vendor: ${checklist.company_name} (${checklist.vendor_id})`);
        console.log(`     - Status: ${checklist.extraction_status}`);
        console.log(`     - Expected Questions: ${checklist.question_count}`);
        console.log(`     - Actual Questions: ${checklist.actual_questions}`);
        console.log(`     - Answered Questions: ${checklist.answered_questions}`);
        console.log(`     - Ready for Trust Portal: ${checklist.actual_questions > 0 && checklist.answered_questions === checklist.actual_questions ? '✅' : '❌'}`);
        console.log(`     - Created: ${checklist.created_at}`);
      });
    }

    // Check checklist questions for the first checklist
    if (checklistsResult.rows.length > 0) {
      const firstChecklist = checklistsResult.rows[0];
      console.log(`\n🤖 QUESTIONS FOR "${firstChecklist.name}":"`);
      const questionsQuery = `
        SELECT id, question_text, status, ai_answer IS NOT NULL AND ai_answer != '' as has_answer,
               CASE WHEN ai_answer IS NOT NULL THEN LENGTH(ai_answer) ELSE 0 END as answer_length,
               requires_document, created_at
        FROM checklist_questions
        WHERE checklist_id = $1
        ORDER BY question_order ASC
      `;
      const questionsResult = await client.query(questionsQuery, [firstChecklist.id]);
      
      questionsResult.rows.forEach((question, index) => {
        console.log(`\n    ${index + 1}. ${question.question_text.substring(0, 80)}...`);
        console.log(`       - ID: ${question.id}`);
        console.log(`       - Status: ${question.status}`);
        console.log(`       - Has Answer: ${question.has_answer ? '✅' : '❌'}`);
        console.log(`       - Answer Length: ${question.answer_length} chars`);
        console.log(`       - Requires Document: ${question.requires_document ? '✅' : '❌'}`);
        console.log(`       - Created: ${question.created_at}`);
      });
    }

    // Check trust portal items
    console.log('\n🏛️ TRUST PORTAL ITEMS ANALYSIS:');
    const trustPortalQuery = `
      SELECT tpi.id, tpi.vendor_id, tpi.title, tpi.category, 
             tpi.is_questionnaire_answer, tpi.questionnaire_id,
             LENGTH(tpi.content) as content_length,
             v.company_name, tpi.created_at
      FROM trust_portal_items tpi
      LEFT JOIN vendors v ON tpi.vendor_id = v.vendor_id
      ORDER BY tpi.created_at DESC
    `;
    const trustPortalResult = await client.query(trustPortalQuery);
    
    if (trustPortalResult.rows.length === 0) {
      console.log('❌ No trust portal items found');
      console.log('💡 This confirms that no checklists have been sent to trust portal yet');
    } else {
      trustPortalResult.rows.forEach((item, index) => {
        console.log(`\n  ${index + 1}. ${item.title}`);
        console.log(`     - ID: ${item.id}`);
        console.log(`     - Vendor: ${item.company_name} (ID: ${item.vendor_id})`);
        console.log(`     - Category: ${item.category}`);
        console.log(`     - Is Questionnaire: ${item.is_questionnaire_answer ? '✅' : '❌'}`);
        console.log(`     - Questionnaire ID: ${item.questionnaire_id || 'N/A'}`);
        console.log(`     - Content Length: ${item.content_length} chars`);
        console.log(`     - Created: ${item.created_at}`);
      });
    }

    // Check supporting documents
    console.log('\n📎 SUPPORTING DOCUMENTS ANALYSIS:');
    const docsQuery = `
      SELECT csd.id, csd.filename, csd.question_id, csd.file_type, 
             csd.file_size, csd.uploaded_at,
             v.company_name, cq.question_text
      FROM checklist_supporting_documents csd
      LEFT JOIN vendors v ON csd.vendor_id = v.uuid
      LEFT JOIN checklist_questions cq ON csd.question_id = cq.id
      ORDER BY csd.uploaded_at DESC
    `;
    const docsResult = await client.query(docsQuery);
    
    if (docsResult.rows.length === 0) {
      console.log('❌ No supporting documents found');
    } else {
      docsResult.rows.forEach((doc, index) => {
        console.log(`\n  ${index + 1}. ${doc.filename}`);
        console.log(`     - ID: ${doc.id}`);
        console.log(`     - Vendor: ${doc.company_name}`);
        console.log(`     - Question: ${doc.question_text ? doc.question_text.substring(0, 50) + '...' : 'N/A'}`);
        console.log(`     - File Type: ${doc.file_type}, Size: ${doc.file_size} bytes`);
        console.log(`     - Uploaded: ${doc.uploaded_at}`);
      });
    }

    console.log('\n🎯 SUMMARY:');
    console.log(`- Total Vendors: ${vendorsResult.rows.length}`);
    console.log(`- Total Checklists: ${checklistsResult.rows.length}`);
    console.log(`- Total Trust Portal Items: ${trustPortalResult.rows.length}`);
    console.log(`- Total Supporting Documents: ${docsResult.rows.length}`);

    if (checklistsResult.rows.length > 0) {
      const readyChecklists = checklistsResult.rows.filter(c => 
        c.actual_questions > 0 && c.answered_questions === c.actual_questions
      );
      console.log(`- Checklists Ready for Trust Portal: ${readyChecklists.length}`);
      
      if (readyChecklists.length > 0) {
        console.log('\n🚀 READY TO TEST:');
        readyChecklists.forEach((checklist, index) => {
          console.log(`  ${index + 1}. Checklist: ${checklist.id}`);
          console.log(`     Vendor UUID: ${checklist.vendor_id}`);
          console.log(`     Company: ${checklist.company_name}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await client.end();
  }
}

fetchAllDatabaseData(); 