const { Client } = require('pg');

// Database connection configuration
const connectionString = 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway';

async function checkDatabaseTables() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database successfully!');
    console.log('=' * 50);
    
    // Get all tables
    console.log('\n📋 LISTING ALL TABLES:');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    console.log('Found', tablesResult.rows.length, 'tables:');
    tablesResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name}`);
    });

    // Check specific tables that are causing issues
    const tablesToCheck = [
      'vendors',
      'vendor_questionnaire_answers', 
      'evidence_files',
      'checklists',
      'checklist_questions',
      'checklist_supporting_documents'
    ];

    for (const tableName of tablesToCheck) {
      console.log(`\n🔍 CHECKING TABLE: ${tableName.toUpperCase()}`);
      console.log('-'.repeat(50));
      
      try {
        // Get table schema
        const schemaQuery = `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position;
        `;
        
        const schemaResult = await client.query(schemaQuery, [tableName]);
        
        if (schemaResult.rows.length === 0) {
          console.log(`❌ Table '${tableName}' does not exist`);
          continue;
        }
        
        console.log('Columns:');
        schemaResult.rows.forEach((col, index) => {
          console.log(`  ${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        // Get row count
        const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
        const countResult = await client.query(countQuery);
        console.log(`📊 Row count: ${countResult.rows[0].count}`);
        
        // For specific tables, show sample data
        if (tableName === 'vendors') {
          console.log('\n📄 Sample vendors data:');
          const sampleQuery = `
            SELECT vendor_id, uuid, company_name, status 
            FROM vendors 
            LIMIT 3
          `;
          const sampleResult = await client.query(sampleQuery);
          sampleResult.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. ID: ${row.vendor_id}, UUID: ${row.uuid}, Company: ${row.company_name}, Status: ${row.status}`);
          });
        }
        
        if (tableName === 'vendor_questionnaire_answers') {
          console.log('\n📄 Sample questionnaire answers with trust portal sharing:');
          const sampleQuery = `
            SELECT vendor_id, question_title, share_to_trust_portal, status 
            FROM vendor_questionnaire_answers 
            WHERE share_to_trust_portal = true
            LIMIT 5
          `;
          const sampleResult = await client.query(sampleQuery);
          if (sampleResult.rows.length > 0) {
            sampleResult.rows.forEach((row, index) => {
              console.log(`  ${index + 1}. Vendor ID: ${row.vendor_id}, Title: ${row.question_title}, Share: ${row.share_to_trust_portal}`);
            });
          } else {
            console.log('  ❌ No questionnaire answers with share_to_trust_portal = true found');
          }
        }
        
        if (tableName === 'evidence_files') {
          console.log('\n📄 Sample evidence files:');
          const sampleQuery = `
            SELECT vendor_id, filename, original_filename 
            FROM evidence_files 
            LIMIT 3
          `;
          const sampleResult = await client.query(sampleQuery);
          sampleResult.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. Vendor ID: ${row.vendor_id}, Filename: ${row.filename || row.original_filename}`);
          });
        }
        
      } catch (error) {
        console.log(`❌ Error checking table '${tableName}':`, error.message);
      }
    }
    
    // Check for the specific vendor that's causing issues
    console.log('\n🎯 CHECKING SPECIFIC VENDOR:');
    console.log('-'.repeat(50));
    const vendorUuid = 'f18eec97-86e9-44c4-80b7-c86461f3efbe';
    
    try {
      const vendorQuery = `
        SELECT vendor_id, uuid, company_name, status
        FROM vendors 
        WHERE uuid = $1
      `;
      const vendorResult = await client.query(vendorQuery, [vendorUuid]);
      
      if (vendorResult.rows.length > 0) {
        const vendor = vendorResult.rows[0];
        console.log(`✅ Found vendor: ${vendor.company_name} (ID: ${vendor.vendor_id}, UUID: ${vendor.uuid})`);
        
        // Check questionnaire answers for this vendor
        const answersQuery = `
          SELECT COUNT(*) as count, 
                 COUNT(*) FILTER (WHERE share_to_trust_portal = true) as shared_count
          FROM vendor_questionnaire_answers 
          WHERE vendor_id = $1
        `;
        const answersResult = await client.query(answersQuery, [vendor.vendor_id]);
        console.log(`📋 Questionnaire answers: ${answersResult.rows[0].count} total, ${answersResult.rows[0].shared_count} shared to trust portal`);
        
        // Check evidence files for this vendor
        const evidenceQuery = `
          SELECT COUNT(*) as count
          FROM evidence_files 
          WHERE vendor_id = $1
        `;
        const evidenceResult = await client.query(evidenceQuery, [vendor.vendor_id]);
        console.log(`📎 Evidence files: ${evidenceResult.rows[0].count}`);
        
      } else {
        console.log(`❌ Vendor with UUID '${vendorUuid}' not found`);
      }
      
    } catch (error) {
      console.log('❌ Error checking specific vendor:', error.message);
    }

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

// Install pg if not installed
console.log('🔧 Checking if pg package is installed...');
try {
  require('pg');
  console.log('✅ pg package is available');
  checkDatabaseTables();
} catch (error) {
  console.log('❌ pg package not found. Installing...');
  console.log('Please run: npm install pg');
  console.log('Then run this script again.');
} 