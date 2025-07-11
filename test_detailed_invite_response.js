const https = require('https');

// Test the trust portal invite endpoint and show detailed response
const testInviteEndpointDetailed = async () => {
  const token = '1752213296666_ww369dkf4';
  const url = `https://garnet-compliance-saas-production.up.railway.app/api/trust-portal/invite/${token}`;
  
  console.log('🔍 Testing Trust Portal Invite API - DETAILED RESPONSE...');
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
          console.log('---');
          
          if (res.statusCode === 200) {
            console.log('📊 FULL RESPONSE DATA:');
            console.log(JSON.stringify(response, null, 2));
            console.log('\n');
            
            console.log('🔍 DETAILED ANALYSIS:');
            console.log('- Vendor:', response.vendor ? `${response.vendor.companyName} (ID: ${response.vendor.vendorId})` : 'Missing');
            console.log('- Trust Portal Items:', response.trustPortalItems ? response.trustPortalItems.length : 0);
            console.log('- Checklists:', response.checklists ? response.checklists.length : 0);
            console.log('- Documents:', response.documents ? response.documents.length : 0);
            
            if (response.trustPortalItems && response.trustPortalItems.length > 0) {
              console.log('\n📋 TRUST PORTAL ITEMS DETAIL:');
              response.trustPortalItems.forEach((item, index) => {
                console.log(`  ${index + 1}. ${item.title}`);
                console.log(`     Category: ${item.category}`);
                console.log(`     Is Questionnaire: ${item.isQuestionnaireAnswer}`);
                console.log(`     Has Content: ${item.content ? 'Yes (' + item.content.length + ' chars)' : 'No'}`);
                
                if (item.isQuestionnaireAnswer && item.content) {
                  try {
                    const parsed = JSON.parse(item.content);
                    console.log(`     📄 JSON Questions Count: ${parsed.questions ? parsed.questions.length : 0}`);
                    if (parsed.questions && parsed.questions.length > 0) {
                      console.log(`     📄 First Question: ${parsed.questions[0].question.substring(0, 60)}...`);
                    }
                  } catch (e) {
                    console.log(`     ❌ JSON Parse Error: ${e.message}`);
                  }
                }
                console.log('');
              });
            }
            
            if (response.checklists && response.checklists.length > 0) {
              console.log('\n📋 CHECKLISTS DETAIL:');
              response.checklists.forEach((checklist, index) => {
                console.log(`  ${index + 1}. ${checklist.name} (${checklist.questions ? checklist.questions.length : 0} questions)`);
                if (checklist.questions && checklist.questions.length > 0) {
                  checklist.questions.slice(0, 2).forEach((question, qIndex) => {
                    console.log(`     Q${qIndex + 1}: ${question.questionText?.substring(0, 50)}...`);
                    console.log(`         Answer: ${question.aiAnswer ? 'Present' : 'Missing'}`);
                  });
                }
              });
            } else {
              console.log('\n❌ NO CHECKLISTS FOUND - This is the problem!');
            }
            
          } else {
            console.log('❌ Error Response:', response);
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
testInviteEndpointDetailed()
  .then(() => {
    console.log('\n🎯 SUMMARY:');
    console.log('If checklists count is 0 but trust portal items exist with questionnaire data,');
    console.log('then the JSON parsing logic in the backend needs to be fixed.');
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
  }); 