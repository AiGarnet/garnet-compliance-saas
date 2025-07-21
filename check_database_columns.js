const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkDatabaseColumns() {
  try {
    await client.connect();
    console.log('🔍 Connected to database for column analysis...\n');

    // Define the tables we want to check
    const tablesToCheck = [
      'vendors',
      'checklists',
      'checklist_questions',
      'checklist_supporting_documents',
      'trust_portal_items',
      'trust_portal_shared_documents',
      'trust_portal_feedback',
      'vendor_questionnaire_answers'
    ];

    for (const tableName of tablesToCheck) {
      console.log(`🔍 TABLE: ${tableName.toUpperCase()}`);
      console.log('='.repeat(60));

      // Get column information
      const columnsQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          ordinal_position
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `;
      
      try {
        const columnsResult = await client.query(columnsQuery, [tableName]);
        
        if (columnsResult.rows.length === 0) {
          console.log(`❌ Table '${tableName}' not found or has no columns\n`);
          continue;
        }

        console.log('📋 COLUMNS:');
        columnsResult.rows.forEach((col, index) => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          
          console.log(`  ${String(index + 1).padStart(2, ' ')}. ${col.column_name.padEnd(25)} | ${(col.data_type + maxLength).padEnd(20)} | ${nullable.padEnd(8)} ${defaultVal}`);
        });

        // Get sample data to verify column usage
        const sampleQuery = `SELECT * FROM ${tableName} LIMIT 1`;
        try {
          const sampleResult = await client.query(sampleQuery);
          if (sampleResult.rows.length > 0) {
            console.log('\n📄 SAMPLE ROW STRUCTURE:');
            const sampleRow = sampleResult.rows[0];
            Object.keys(sampleRow).forEach((key, index) => {
              const value = sampleRow[key];
              let displayValue = value;
              
              if (value === null) {
                displayValue = 'NULL';
              } else if (typeof value === 'string' && value.length > 50) {
                displayValue = value.substring(0, 50) + '...';
              } else if (typeof value === 'object') {
                displayValue = JSON.stringify(value);
                if (displayValue.length > 50) {
                  displayValue = displayValue.substring(0, 50) + '...';
                }
              }
              
              console.log(`    ${key}: ${displayValue}`);
            });
          } else {
            console.log('\n📄 No sample data available (table is empty)');
          }
        } catch (sampleError) {
          console.log(`\n❌ Could not fetch sample data: ${sampleError.message}`);
        }

      } catch (error) {
        console.log(`❌ Error fetching columns for table '${tableName}': ${error.message}`);
      }

      console.log('\n' + '='.repeat(80) + '\n');
    }

    // Now let's check specific queries that are used in the application
    console.log('🔍 ANALYZING SPECIFIC QUERIES USED IN APPLICATION...\n');

    // 1. Check vendors table query (used in trust portal)
    console.log('1️⃣ VENDORS TABLE QUERY ANALYSIS:');
    const vendorsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vendors' 
      ORDER BY ordinal_position
    `;
    const vendorsColumns = await client.query(vendorsQuery);
    const vendorColumnNames = vendorsColumns.rows.map(row => row.column_name);
    
    console.log('Available columns:', vendorColumnNames.join(', '));
    
    // Check the specific columns used in backend queries
    const requiredVendorColumns = [
      'vendor_id', 'uuid', 'company_name', 'region', 'industry', 
      'description', 'website', 'contact_email', 'contact_name', 
      'status', 'created_at', 'updated_at'
    ];
    
    console.log('\nColumns used in backend queries:');
    requiredVendorColumns.forEach(col => {
      const exists = vendorColumnNames.includes(col);
      console.log(`  ${col}: ${exists ? '✅' : '❌'}`);
    });

    // 2. Check trust_portal_items table
    console.log('\n2️⃣ TRUST_PORTAL_ITEMS TABLE QUERY ANALYSIS:');
    const trustPortalQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'trust_portal_items' 
      ORDER BY ordinal_position
    `;
    const trustPortalColumns = await client.query(trustPortalQuery);
    const trustPortalColumnNames = trustPortalColumns.rows.map(row => row.column_name);
    
    console.log('Available columns:', trustPortalColumnNames.join(', '));
    
    const requiredTrustPortalColumns = [
      'id', 'vendor_id', 'title', 'description', 'category',
      'file_url', 'file_type', 'file_size', 'content',
      'is_questionnaire_answer', 'questionnaire_id',
      'is_follow_up', 'parent_submission_id', 'follow_up_type',
      'follow_up_reason', 'submission_sequence', 'created_at', 'updated_at'
    ];
    
    console.log('\nColumns used in backend queries:');
    requiredTrustPortalColumns.forEach(col => {
      const exists = trustPortalColumnNames.includes(col);
      console.log(`  ${col}: ${exists ? '✅' : '❌'}`);
    });

    // 3. Check checklists table
    console.log('\n3️⃣ CHECKLISTS TABLE QUERY ANALYSIS:');
    const checklistsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'checklists' 
      ORDER BY ordinal_position
    `;
    const checklistsColumns = await client.query(checklistsQuery);
    const checklistsColumnNames = checklistsColumns.rows.map(row => row.column_name);
    
    console.log('Available columns:', checklistsColumnNames.join(', '));
    
    const requiredChecklistColumns = [
      'id', 'vendor_id', 'name', 'file_type', 'file_size',
      'original_filename', 'extraction_status', 'question_count',
      'upload_date', 'spaces_key', 'spaces_url', 'created_at', 'updated_at'
    ];
    
    console.log('\nColumns used in backend queries:');
    requiredChecklistColumns.forEach(col => {
      const exists = checklistsColumnNames.includes(col);
      console.log(`  ${col}: ${exists ? '✅' : '❌'}`);
    });

    // 4. Check checklist_questions table
    console.log('\n4️⃣ CHECKLIST_QUESTIONS TABLE QUERY ANALYSIS:');
    const questionsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'checklist_questions' 
      ORDER BY ordinal_position
    `;
    const questionsColumns = await client.query(questionsQuery);
    const questionsColumnNames = questionsColumns.rows.map(row => row.column_name);
    
    console.log('Available columns:', questionsColumnNames.join(', '));
    
    const requiredQuestionColumns = [
      'id', 'checklist_id', 'vendor_id', 'question_text', 'question_order',
      'status', 'ai_answer', 'confidence_score', 'requires_document',
      'document_description', 'created_at', 'updated_at'
    ];
    
    console.log('\nColumns used in backend queries:');
    requiredQuestionColumns.forEach(col => {
      const exists = questionsColumnNames.includes(col);
      console.log(`  ${col}: ${exists ? '✅' : '❌'}`);
    });

    // 5. Test actual queries used in the application
    console.log('\n🧪 TESTING ACTUAL BACKEND QUERIES...\n');

    // Test the trust portal vendor query
    console.log('Testing trust portal vendor query...');
    try {
      const testVendorId = 2; // Testing1 vendor
      const testQuery = `
        SELECT 
          id,
          vendor_id as "vendorId",
          title,
          description,
          category,
          file_url as "fileUrl",
          file_type as "fileType",
          file_size as "fileSize",
          content,
          is_questionnaire_answer as "isQuestionnaireAnswer",
          questionnaire_id as "questionnaireId",
          is_follow_up as "isFollowUp",
          parent_submission_id as "parentSubmissionId",
          follow_up_type as "followUpType",
          follow_up_reason as "followUpReason",
          submission_sequence as "submissionSequence",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM trust_portal_items
        WHERE vendor_id = $1
        ORDER BY submission_sequence DESC, created_at DESC
        LIMIT 1
      `;
      
      const testResult = await client.query(testQuery, [testVendorId]);
      console.log(`✅ Trust portal query successful - found ${testResult.rows.length} items`);
      
      if (testResult.rows.length > 0) {
        console.log('Sample result structure:');
        Object.keys(testResult.rows[0]).forEach(key => {
          console.log(`  ${key}: ${typeof testResult.rows[0][key]}`);
        });
      }
      
    } catch (error) {
      console.log(`❌ Trust portal query failed: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await client.end();
  }
}

checkDatabaseColumns(); 