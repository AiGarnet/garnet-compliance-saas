const { Pool } = require('pg');

const pool = new Pool({
  host: 'shortline.proxy.rlwy.net',
  port: 28381,
  database: 'railway',
  user: 'postgres',
  password: 'FaHfoxEmIwaAJuzOmQTOfStkainUxzzX',
  ssl: {
    rejectUnauthorized: false
  }
});

async function debugFrontendData() {
  try {
    console.log('🔍 DEBUGGING FRONTEND DATA FLOW');
    console.log('===============================\n');

    // Get the same checklist that worked in our test
    const checklistQuery = `
      SELECT 
        c.id as checklist_id,
        c.vendor_id,
        c.name as checklist_name,
        v.company_name,
        v.vendor_id as vendor_numeric_id
      FROM checklists c
      INNER JOIN vendors v ON c.vendor_id = v.uuid
      WHERE c.name = 'questions_1.txt'
      LIMIT 1
    `;
    
    const checklistResult = await pool.query(checklistQuery);
    
    if (checklistResult.rows.length === 0) {
      console.log('❌ Test checklist not found');
      return;
    }
    
    const checklist = checklistResult.rows[0];
    console.log('📋 Test Checklist:', checklist.checklist_name);
    console.log('   - Checklist ID:', checklist.checklist_id);
    console.log('   - Vendor UUID:', checklist.vendor_id);
    console.log('   - Vendor Numeric ID:', checklist.vendor_numeric_id);
    console.log('');

    // Check what the backend API returns for checklist questions
    console.log('🔧 Testing Backend API - getChecklistQuestions...');
    const backendApiUrl = `https://garnet-compliance-saas-production.up.railway.app/api/checklists/${checklist.checklist_id}/questions/vendor/${checklist.vendor_id}`;
    console.log('API URL:', backendApiUrl);
    
    const backendResponse = await fetch(backendApiUrl);
    if (backendResponse.ok) {
      const backendQuestions = await backendResponse.json();
      console.log('✅ Backend API Response:');
      console.log(`   - Questions returned: ${backendQuestions.length}`);
      
      backendQuestions.forEach((q, index) => {
        console.log(`${index + 1}. Question ID: ${q.id}`);
        console.log(`   - Text: ${q.questionText.substring(0, 50)}...`);
        console.log(`   - Status: ${q.status}`);
        console.log(`   - Has AI Answer: ${q.aiAnswer ? 'YES' : 'NO'} (${q.aiAnswer?.length || 0} chars)`);
        console.log(`   - Confidence: ${q.confidenceScore}`);
        console.log('');
      });
      
      // Check if frontend validation would pass
      const questionsWithAnswers = backendQuestions.filter(q => 
        (q.aiAnswer && q.aiAnswer.trim() !== '') || q.status === 'completed'
      );
      const isReadyForTrustPortal = questionsWithAnswers.length === backendQuestions.length && backendQuestions.length > 0;
      
      console.log('🎯 Frontend Validation Check:');
      console.log(`   - Questions with answers or completed status: ${questionsWithAnswers.length}/${backendQuestions.length}`);
      console.log(`   - Would show "Send to Trust Portal" button: ${isReadyForTrustPortal ? '✅ YES' : '❌ NO'}`);
      
      if (!isReadyForTrustPortal) {
        console.log('\n🚨 ISSUE FOUND: Frontend validation would BLOCK trust portal submission!');
        console.log('Questions failing validation:');
        const failingQuestions = backendQuestions.filter(q => 
          !(q.aiAnswer && q.aiAnswer.trim() !== '') && q.status !== 'completed'
        );
        failingQuestions.forEach((q, index) => {
          console.log(`${index + 1}. ${q.questionText.substring(0, 60)}...`);
          console.log(`   - Status: "${q.status}" (should be "completed")`);
          console.log(`   - AI Answer: ${q.aiAnswer ? `"${q.aiAnswer.substring(0, 30)}..."` : 'NULL/EMPTY'}`);
          console.log('');
        });
      }
      
    } else {
      console.log('❌ Backend API failed:', backendResponse.status);
      const errorText = await backendResponse.text();
      console.log('Error:', errorText);
    }

    // Also check the vendor endpoint
    console.log('\n🏪 Testing Backend API - getVendorChecklists...');
    const vendorApiUrl = `https://garnet-compliance-saas-production.up.railway.app/api/checklists/vendor/${checklist.vendor_id}`;
    console.log('API URL:', vendorApiUrl);
    
    const vendorResponse = await fetch(vendorApiUrl);
    if (vendorResponse.ok) {
      const vendorChecklists = await vendorResponse.json();
      console.log('✅ Vendor Checklists API Response:');
      console.log(`   - Checklists returned: ${vendorChecklists.length}`);
      
      const targetChecklist = vendorChecklists.find(c => c.id === checklist.checklist_id);
      if (targetChecklist) {
        console.log('   - Target checklist found:');
        console.log(`     * Name: ${targetChecklist.name}`);
        console.log(`     * Question Count: ${targetChecklist.questionCount}`);
        console.log(`     * Extraction Status: ${targetChecklist.extractionStatus}`);
      } else {
        console.log('   - Target checklist NOT found in vendor checklists');
      }
    } else {
      console.log('❌ Vendor API failed:', vendorResponse.status);
    }

  } catch (error) {
    console.error('💥 Debug test failed:', error.message);
  } finally {
    await pool.end();
  }
}

debugFrontendData(); 