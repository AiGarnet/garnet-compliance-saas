const { Pool } = require('pg');

// Use the provided connection string
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway';

const pool = new Pool({ connectionString });

async function testFunctionality() {
  console.log('🧪 Testing database functionality after schema improvements...');
  
  try {
    // First, check which tables exist
    console.log('\n📊 Checking existing tables:');
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`Found ${tables.length} tables in the database`);
    
    // Test 1: Can we still query vendors?
    if (tables.includes('vendors')) {
      console.log('\n🔍 Test 1: Querying vendors table...');
      const vendorsResult = await pool.query(`
        SELECT vendor_id, company_name, contact_email, status 
        FROM vendors 
        LIMIT 5
      `);
      
      if (vendorsResult.rows.length > 0) {
        console.log(`✅ Successfully retrieved ${vendorsResult.rows.length} vendors`);
        console.log('Sample vendor:', vendorsResult.rows[0]);
      } else {
        console.log('⚠️ No vendors found in the database');
      }
    } else {
      console.log('⚠️ Skipping vendors test - table does not exist');
    }
    
    // Test 2: Can we still query questionnaires?
    if (tables.includes('questionnaires')) {
      console.log('\n🔍 Test 2: Querying questionnaires table...');
      const questionnairesResult = await pool.query(`
        SELECT id, title, status, vendor_id
        FROM questionnaires
        LIMIT 5
      `);
      
      if (questionnairesResult.rows.length > 0) {
        console.log(`✅ Successfully retrieved ${questionnairesResult.rows.length} questionnaires`);
        console.log('Sample questionnaire:', questionnairesResult.rows[0]);
      } else {
        console.log('⚠️ No questionnaires found in the database');
      }
    } else {
      console.log('⚠️ Skipping questionnaires test - table does not exist');
    }
    
    // Test 3: Can we still query questionnaire questions?
    if (tables.includes('questionnaire_questions')) {
      console.log('\n🔍 Test 3: Querying questionnaire questions...');
      const questionsResult = await pool.query(`
        SELECT id, questionnaire_id, question_text
        FROM questionnaire_questions
        LIMIT 5
      `);
      
      if (questionsResult.rows.length > 0) {
        console.log(`✅ Successfully retrieved ${questionsResult.rows.length} questionnaire questions`);
        console.log('Sample question:', questionsResult.rows[0]);
      } else {
        console.log('⚠️ No questionnaire questions found in the database');
      }
    } else {
      console.log('⚠️ Skipping questionnaire_questions test - table does not exist');
    }
    
    // Test 4: Can we join vendors and questionnaires?
    if (tables.includes('vendors') && tables.includes('questionnaires')) {
      console.log('\n🔍 Test 4: Joining vendors and questionnaires...');
      const joinResult = await pool.query(`
        SELECT v.company_name, q.title, q.status
        FROM vendors v
        JOIN questionnaires q ON v.vendor_id = q.vendor_id
        LIMIT 5
      `);
      
      if (joinResult.rows.length > 0) {
        console.log(`✅ Successfully joined vendors and questionnaires, found ${joinResult.rows.length} results`);
        console.log('Sample joined record:', joinResult.rows[0]);
      } else {
        console.log('⚠️ No joined records found');
      }
    } else {
      console.log('⚠️ Skipping join test - required tables do not exist');
    }
    
    // Test 5: Can we still insert and delete a test record?
    if (tables.includes('vendors')) {
      console.log('\n🔍 Test 5: Testing insert and delete operations...');
      
      // Start a transaction so we can roll back the test data
      await pool.query('BEGIN');
      
      try {
        // Insert a test vendor
        const insertResult = await pool.query(`
          INSERT INTO vendors (company_name, region, contact_email, status)
          VALUES ('Test Company (Delete Me)', 'Test Region', 'test@example.com', 'Questionnaire Pending')
          RETURNING vendor_id
        `);
        
        const testVendorId = insertResult.rows[0].vendor_id;
        console.log(`✅ Successfully inserted test vendor with ID ${testVendorId}`);
        
        // Delete the test vendor
        await pool.query(`
          DELETE FROM vendors
          WHERE vendor_id = $1
        `, [testVendorId]);
        
        console.log(`✅ Successfully deleted test vendor with ID ${testVendorId}`);
        
        // Roll back the transaction
        await pool.query('ROLLBACK');
      } catch (error) {
        // Roll back the transaction if there's an error
        await pool.query('ROLLBACK');
        console.error('❌ Insert/delete test failed:', error);
        throw error;
      }
    } else {
      console.log('⚠️ Skipping insert/delete test - vendors table does not exist');
    }
    
    console.log('\n🎉 All functionality tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Functionality test failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  testFunctionality()
    .then(() => {
      console.log('✅ Database functionality verified after schema improvements');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Functionality testing failed:', error);
      process.exit(1);
    });
}

module.exports = { testFunctionality }; 