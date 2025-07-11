const https = require('https');

// Test the trust portal invite endpoint
const testInviteEndpoint = async () => {
  const token = '1752213296666_ww369dkf4';
  const url = `https://garnet-compliance-saas-production.up.railway.app/api/trust-portal/invite/${token}`;
  
  console.log('🔍 Testing Trust Portal Invite API...');
  console.log('URL:', url);
  console.log('Token:', token);
  console.log('---');
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Response Status:', res.statusCode);
          console.log('✅ Response Headers:', res.headers);
          console.log('---');
          console.log('📊 Response Data Structure:');
          console.log('- Vendor:', response.vendor ? '✅ Present' : '❌ Missing');
          console.log('- Checklists:', response.checklists ? `✅ Present (${response.checklists.length} items)` : '❌ Missing');
          console.log('- Documents:', response.documents ? `✅ Present (${response.documents.length} items)` : '❌ Missing');
          console.log('- Trust Portal Items:', response.trustPortalItems ? `✅ Present (${response.trustPortalItems.length} items)` : '❌ Missing');
          console.log('- Questionnaire Answers:', response.questionnaireAnswers ? `✅ Present (${response.questionnaireAnswers.length} items)` : '❌ Missing');
          console.log('- Evidence Files:', response.evidenceFiles ? `✅ Present (${response.evidenceFiles.length} items)` : '❌ Missing');
          console.log('---');
          
          if (response.checklists && response.checklists.length > 0) {
            console.log('📋 Checklists Details:');
            response.checklists.forEach((checklist, index) => {
              console.log(`  ${index + 1}. ${checklist.name} (${checklist.questions?.length || 0} questions)`);
              if (checklist.questions && checklist.questions.length > 0) {
                checklist.questions.slice(0, 2).forEach((question, qIndex) => {
                  console.log(`     Q${qIndex + 1}: ${question.questionText?.substring(0, 50)}...`);
                  console.log(`         Answer: ${question.aiAnswer ? 'Present' : 'Missing'}`);
                });
              }
            });
          }
          
          if (response.documents && response.documents.length > 0) {
            console.log('📄 Documents Details:');
            response.documents.forEach((doc, index) => {
              console.log(`  ${index + 1}. ${doc.filename} (${doc.fileType})`);
            });
          }
          
          console.log('---');
          console.log('🎯 Fix Status:');
          const hasChecklists = response.checklists && response.checklists.length > 0;
          const hasDocuments = response.documents && response.documents.length > 0;
          
          if (hasChecklists || hasDocuments) {
            console.log('✅ SUCCESS: Trust Portal now shows vendor data!');
            console.log('   - Frontend will now display submitted questionnaire answers');
            console.log('   - Supporting documents are available for download');
          } else {
            console.log('⚠️  PARTIAL: API structure fixed, but no data found for this vendor');
            console.log('   - Check if vendor has submitted questionnaires with "Share to Trust Portal" enabled');
            console.log('   - Check if vendor has uploaded evidence files');
          }
          
          resolve(response);
        } catch (error) {
          console.error('❌ Error parsing response:', error);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error('❌ Request failed:', error);
      reject(error);
    });
  });
};

// Run the test
testInviteEndpoint()
  .then(() => {
    console.log('\n🚀 Test completed successfully!');
    console.log('💡 Next steps:');
    console.log('   1. Visit https://www.garnetai.net/trust-portal/invite/?token=1752213296666_ww369dkf4');
    console.log('   2. Verify that questionnaire answers and documents are now visible');
    console.log('   3. If no data shows, ensure the vendor has:');
    console.log('      - Submitted questionnaires with "Share to Trust Portal" enabled');
    console.log('      - Uploaded evidence files');
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }); 