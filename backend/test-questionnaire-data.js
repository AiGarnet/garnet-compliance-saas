const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testQuestionnaireData() {
  try {
    console.log('🔍 Testing database connection and questionnaire data...\n');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check vendors table
    const vendorsResult = await client.query('SELECT vendor_id, uuid, company_name, status FROM vendors LIMIT 5');
    console.log(`\n📊 Found ${vendorsResult.rows.length} vendors:`);
    vendorsResult.rows.forEach(vendor => {
      console.log(`  - ID: ${vendor.vendor_id}, UUID: ${vendor.uuid}, Name: ${vendor.company_name}, Status: ${vendor.status}`);
    });
    
    // Check questionnaire answers table
    const answersResult = await client.query(`
      SELECT vqa.*, v.company_name 
      FROM vendor_questionnaire_answers vqa 
      JOIN vendors v ON vqa.vendor_id = v.vendor_id 
      LIMIT 10
    `);
    console.log(`\n📝 Found ${answersResult.rows.length} questionnaire answers:`);
    answersResult.rows.forEach(answer => {
      console.log(`  - Vendor: ${answer.company_name}`);
      console.log(`    Question: ${answer.question}`);
      console.log(`    Answer: ${answer.answer}`);
      console.log(`    Created: ${answer.created_at}\n`);
    });
    
    // Test specific vendor with UUID
    const specificVendorResult = await client.query(`
      SELECT v.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', vqa.id,
                   'questionId', vqa.question_id,
                   'question', vqa.question,
                   'answer', vqa.answer,
                   'createdAt', vqa.created_at,
                   'updatedAt', vqa.updated_at
                 ) ORDER BY vqa.created_at
               ) FILTER (WHERE vqa.id IS NOT NULL), 
               '[]'::json
             ) as questionnaire_answers
      FROM vendors v
      LEFT JOIN vendor_questionnaire_answers vqa ON v.vendor_id = vqa.vendor_id
      WHERE v.uuid = $1
      GROUP BY v.vendor_id
    `, ['9321c032-0146-4751-be7b-1683d8b5a1b9']);
    
    if (specificVendorResult.rows.length > 0) {
      const vendor = specificVendorResult.rows[0];
      console.log(`\n🎯 Specific vendor test (UUID: 9321c032-0146-4751-be7b-1683d8b5a1b9):`);
      console.log(`  Name: ${vendor.company_name}`);
      console.log(`  Status: ${vendor.status}`);
      console.log(`  Questionnaire Answers: ${JSON.stringify(vendor.questionnaire_answers, null, 2)}`);
    } else {
      console.log(`\n❌ Vendor with UUID 9321c032-0146-4751-be7b-1683d8b5a1b9 not found`);
    }
    
    client.release();
    console.log('\n✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Error testing database:', error);
  } finally {
    await pool.end();
  }
}

testQuestionnaireData(); 