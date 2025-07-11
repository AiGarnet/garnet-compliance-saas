const { Client } = require('pg');

async function debugSupportingDocuments() {
  const client = new Client({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'autorack.proxy.rlwy.net',
    database: process.env.PGDATABASE || 'railway',
    password: process.env.PGPASSWORD || 'PvtMyNaTcAQCkBJnqvfZXgTqjxPJOuaA',
    port: process.env.PGPORT || 33975,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Get vendor UUID
    const vendorId = 11;
    const vendorUuidQuery = `SELECT uuid FROM vendors WHERE vendor_id = $1`;
    const vendorUuidResult = await client.query(vendorUuidQuery, [vendorId]);
    const vendorUuid = vendorUuidResult.rows[0]?.uuid;
    
    console.log(`🔍 Vendor ID: ${vendorId}`);
    console.log(`🔍 Vendor UUID: ${vendorUuid}`);

    if (vendorUuid) {
      // Test the exact query used in the backend
      const supportingDocsQuery = `
        SELECT 
          csd.id,
          csd.question_id as "questionId",
          csd.filename,
          csd.file_type as "fileType",
          csd.file_size as "fileSize",
          csd.spaces_url as "spacesUrl",
          csd.uploaded_at as "uploadedAt",
          cq.question_text as "questionText"
        FROM checklist_supporting_documents csd
        LEFT JOIN checklist_questions cq ON csd.question_id = cq.id
        WHERE csd.vendor_id = $1
        ORDER BY csd.uploaded_at DESC
      `;
      
      console.log('\n📋 Executing supporting documents query...');
      console.log('Query:', supportingDocsQuery);
      console.log('Params:', [vendorUuid]);
      
      const supportingDocsResult = await client.query(supportingDocsQuery, [vendorUuid]);
      
      console.log(`\n📊 Supporting Documents Found: ${supportingDocsResult.rows.length}`);
      
      if (supportingDocsResult.rows.length > 0) {
        console.log('\n📄 Supporting Documents Details:');
        supportingDocsResult.rows.forEach((doc, index) => {
          console.log(`  ${index + 1}. ${doc.filename} (${doc.fileType})`);
          console.log(`     Question ID: ${doc.questionId}`);
          console.log(`     Question Text: ${doc.questionText ? doc.questionText.substring(0, 100) + '...' : 'No question linked'}`);
          console.log(`     URL: ${doc.spacesUrl}`);
          console.log(`     Uploaded: ${doc.uploadedAt}`);
          console.log('');
        });
        
        // Test the question documents mapping logic
        console.log('\n🗺️ Testing Question Documents Mapping...');
        const questionDocumentsMap = new Map();
        const generalDocuments = [];
        
        supportingDocsResult.rows.forEach(doc => {
          const docInfo = {
            id: doc.id,
            filename: doc.filename,
            fileType: doc.fileType || 'application/octet-stream',
            spacesUrl: doc.spacesUrl,
            uploadedAt: doc.uploadedAt
          };
          
          if (doc.questionId) {
            console.log(`📎 Mapping document "${doc.filename}" to question "${doc.questionId}"`);
            if (!questionDocumentsMap.has(doc.questionId)) {
              questionDocumentsMap.set(doc.questionId, []);
            }
            questionDocumentsMap.get(doc.questionId).push(docInfo);
          } else {
            console.log(`📎 Adding document "${doc.filename}" to general documents`);
            generalDocuments.push(docInfo);
          }
        });
        
        console.log('\n📋 Question Documents Map:');
        for (const [questionId, docs] of questionDocumentsMap.entries()) {
          console.log(`  Question ${questionId}: ${docs.length} documents`);
          docs.forEach((doc, index) => {
            console.log(`    ${index + 1}. ${doc.filename}`);
          });
        }
        
        console.log(`\n📄 General Documents: ${generalDocuments.length}`);
        generalDocuments.forEach((doc, index) => {
          console.log(`  ${index + 1}. ${doc.filename}`);
        });
        
      } else {
        console.log('❌ No supporting documents found');
      }
    } else {
      console.log('❌ Vendor UUID not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

debugSupportingDocuments(); 