const { Pool } = require('pg');

const pool = new Pool({
  host: 'junction.proxy.rlwy.net',
  port: 56461,
  database: 'railway',
  user: 'postgres',
  password: 'YpKBhcPGxVRJmUcRtOKVjDcMNcOsGGxK',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testFollowUpSubmission() {
  try {
    console.log('Testing follow-up submission with fixed backend...');
    
    // First, let's get a checklist that's ready for submission
    const checklistQuery = `
      SELECT 
        c.id as checklist_id,
        c.vendor_id,
        c.name as checklist_name,
        COUNT(cq.id) as total_questions,
        COUNT(CASE WHEN cq.ai_answer IS NOT NULL AND cq.ai_answer != '' THEN 1 END) as completed_questions
      FROM checklists c
      LEFT JOIN checklist_questions cq ON c.id = cq.checklist_id
      WHERE c.vendor_id IS NOT NULL
      GROUP BY c.id, c.vendor_id, c.name
      HAVING COUNT(cq.id) > 0 
        AND COUNT(cq.id) = COUNT(CASE WHEN cq.ai_answer IS NOT NULL AND cq.ai_answer != '' THEN 1 END)
      ORDER BY c.upload_date DESC
      LIMIT 1
    `;
    
    const checklistResult = await pool.query(checklistQuery);
    
    if (checklistResult.rows.length === 0) {
      console.log('No completed checklists found for testing');
      return;
    }
    
    const checklist = checklistResult.rows[0];
    console.log('Found completed checklist:', {
      id: checklist.checklist_id,
      vendor_id: checklist.vendor_id,
      name: checklist.checklist_name,
      completed_questions: checklist.completed_questions
    });

    // Test the API endpoint with follow-up data
    const endpoint = `http://localhost:3001/api/checklists/${checklist.checklist_id}/vendor/${checklist.vendor_id}/send-to-trust-portal`;
    
    const followUpData = {
      message: "Follow-up submission with additional documents",
      title: "Updated Compliance Questionnaire - Additional Documentation",
      isFollowUp: true,
      followUpType: "additional_docs",
      followUpReason: "Requested additional documentation for SOX compliance",
      parentSubmissionId: 1
    };

    console.log('Sending follow-up data:', followUpData);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(followUpData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API call failed:', response.status, errorText);
      return;
    }

    const result = await response.json();
    console.log('API Response:', result);

    // Now check the database to see if the follow-up data was stored correctly
    const trustPortalQuery = `
      SELECT 
        id,
        title,
        is_follow_up,
        follow_up_type,
        follow_up_reason,
        parent_submission_id,
        created_at
      FROM trust_portal_items 
      WHERE id = $1
    `;

    const trustPortalResult = await pool.query(trustPortalQuery, [result.trustPortalId]);
    
    if (trustPortalResult.rows.length > 0) {
      const item = trustPortalResult.rows[0];
      console.log('Stored Trust Portal Item:');
      console.log('- ID:', item.id);
      console.log('- Title:', item.title);
      console.log('- Is Follow-up:', item.is_follow_up);
      console.log('- Follow-up Type:', item.follow_up_type);
      console.log('- Follow-up Reason:', item.follow_up_reason);
      console.log('- Parent Submission ID:', item.parent_submission_id);
      console.log('- Created At:', item.created_at);
      
      // Verify the values match what we sent
      if (item.is_follow_up === true && 
          item.follow_up_type === 'additional_docs' && 
          item.follow_up_reason === 'Requested additional documentation for SOX compliance' &&
          item.parent_submission_id === 1) {
        console.log('✅ SUCCESS: Follow-up data was stored correctly!');
      } else {
        console.log('❌ ISSUE: Follow-up data doesn\'t match expected values');
      }
    } else {
      console.log('❌ Could not find the created trust portal item');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testFollowUpSubmission(); 