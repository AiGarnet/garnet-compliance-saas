const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkChecklistIds() {
  try {
    await client.connect();
    console.log('Connected to database successfully!\n');

    // Get checklists with their questions
    console.log('=== AVAILABLE CHECKLISTS ===');
    const checklists = await client.query(`
      SELECT 
        c.id,
        c.vendor_id,
        c.name,
        c.extraction_status,
        c.question_count,
        v.vendor_id as vendor_numeric_id,
        v.company_name,
        COUNT(cq.id) as actual_question_count,
        COUNT(CASE WHEN cq.status = 'completed' AND cq.ai_answer IS NOT NULL THEN 1 END) as completed_questions
      FROM checklists c
      JOIN vendors v ON c.vendor_id = v.uuid
      LEFT JOIN checklist_questions cq ON c.id = cq.checklist_id
      GROUP BY c.id, c.vendor_id, c.name, c.extraction_status, c.question_count, v.vendor_id, v.company_name
      ORDER BY c.created_at DESC
    `);
    
    checklists.rows.forEach((checklist, index) => {
      console.log(`  Checklist ${index + 1}:`);
      console.log(`    ID: ${checklist.id}`);
      console.log(`    Name: ${checklist.name}`);
      console.log(`    Vendor UUID: ${checklist.vendor_id}`);
      console.log(`    Vendor ID: ${checklist.vendor_numeric_id}`);
      console.log(`    Company: ${checklist.company_name}`);
      console.log(`    Status: ${checklist.extraction_status}`);
      console.log(`    Questions: ${checklist.completed_questions}/${checklist.actual_question_count} completed`);
      console.log('');
    });

    // Check which ones are ready for trust portal
    console.log('=== CHECKLISTS READY FOR TRUST PORTAL ===');
    const readyChecklists = checklists.rows.filter(c => 
      c.extraction_status === 'completed' && 
      c.completed_questions === c.actual_question_count &&
      c.actual_question_count > 0
    );
    
    if (readyChecklists.length === 0) {
      console.log('No checklists are ready for trust portal submission.');
    } else {
      readyChecklists.forEach((checklist, index) => {
        console.log(`  Ready Checklist ${index + 1}:`);
        console.log(`    ID: ${checklist.id}`);
        console.log(`    Name: ${checklist.name}`);
        console.log(`    Vendor UUID: ${checklist.vendor_id}`);
        console.log(`    Company: ${checklist.company_name}`);
        console.log(`    Questions: ${checklist.completed_questions}/${checklist.actual_question_count} completed`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await client.end();
  }
}

checkChecklistIds(); 