const { Client } = require('pg');

// Database connection configuration
const connectionString = 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway';

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to database successfully\n');

    // 1. Check evidence_files table structure
    console.log('📋 CHECKING EVIDENCE FILES TABLE STRUCTURE');
    console.log('='.repeat(50));
    
    const evidenceTableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'evidence_files'
      ORDER BY ordinal_position;
    `);
    
    console.log('Evidence Files Table Columns:');
    evidenceTableInfo.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    console.log();

    // 2. Check vendors table structure
    console.log('👥 CHECKING VENDORS TABLE STRUCTURE');
    console.log('='.repeat(50));
    
    const vendorsTableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'vendors'
      ORDER BY ordinal_position;
    `);
    
    console.log('Vendors Table Columns:');
    vendorsTableInfo.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    console.log();

    // 3. Check current evidence files data
    console.log('📁 CHECKING EVIDENCE FILES DATA');
    console.log('='.repeat(50));
    
    const evidenceFiles = await client.query(`
      SELECT 
        id,
        vendor_id,
        filename,
        original_filename,
        file_type,
        file_size,
        description,
        category,
        uploaded_by,
        created_at
      FROM evidence_files
      ORDER BY created_at DESC
      LIMIT 10;
    `);
    
    console.log(`Found ${evidenceFiles.rows.length} evidence files (showing last 10):`);
    evidenceFiles.rows.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.original_filename}`);
      console.log(`     ID: ${file.id}`);
      console.log(`     Vendor ID: ${file.vendor_id}`);
      console.log(`     Uploaded by: ${file.uploaded_by}`);
      console.log(`     Category: ${file.category}`);
      console.log(`     Created: ${file.created_at}`);
      console.log();
    });

    // 4. Check vendors data
    console.log('👤 CHECKING VENDORS DATA');
    console.log('='.repeat(50));
    
    const vendors = await client.query(`
      SELECT 
        vendor_id,
        uuid,
        company_name,
        created_at
      FROM vendors
      ORDER BY created_at DESC
      LIMIT 10;
    `);
    
    console.log(`Found ${vendors.rows.length} vendors (showing last 10):`);
    vendors.rows.forEach((vendor, index) => {
      console.log(`  ${index + 1}. ${vendor.company_name}`);
      console.log(`     Vendor ID: ${vendor.vendor_id}`);
      console.log(`     UUID: ${vendor.uuid}`);
      console.log(`     Created: ${vendor.created_at}`);
      console.log();
    });

    // 5. Check for orphaned evidence files (vendor_id doesn't match any vendor)
    console.log('🔍 CHECKING FOR ORPHANED EVIDENCE FILES');
    console.log('='.repeat(50));
    
    const orphanedFiles = await client.query(`
      SELECT ef.id, ef.vendor_id, ef.original_filename, ef.uploaded_by
      FROM evidence_files ef
      LEFT JOIN vendors v ON ef.vendor_id = v.uuid
      WHERE v.uuid IS NULL;
    `);
    
    if (orphanedFiles.rows.length > 0) {
      console.log(`❌ Found ${orphanedFiles.rows.length} orphaned evidence files:`);
      orphanedFiles.rows.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.original_filename} (vendor_id: ${file.vendor_id}, uploaded_by: ${file.uploaded_by})`);
      });
    } else {
      console.log('✅ No orphaned evidence files found');
    }
    console.log();

    // 6. Check uploaded_by field validity (should be UUID or specific system values)
    console.log('🔐 CHECKING UPLOADED_BY FIELD VALIDITY');
    console.log('='.repeat(50));
    
    const uploadedByCheck = await client.query(`
      SELECT 
        uploaded_by::text,
        COUNT(*) as count,
        CASE 
          WHEN uploaded_by::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'Valid UUID'
          WHEN uploaded_by::text IN ('ai-system', 'ai-generator', 'system') THEN 'System Value'
          WHEN uploaded_by IS NULL THEN 'NULL (System)'
          ELSE 'Invalid Format'
        END as validation_status
      FROM evidence_files
      GROUP BY uploaded_by
      ORDER BY count DESC;
    `);
    
    console.log('Uploaded By Values:');
    uploadedByCheck.rows.forEach(row => {
      const status = row.validation_status === 'Invalid Format' ? '❌' : '✅';
      console.log(`  ${status} ${row.uploaded_by} (${row.count} files) - ${row.validation_status}`);
    });
    console.log();

    // 7. Check evidence files per vendor
    console.log('📊 EVIDENCE FILES PER VENDOR');
    console.log('='.repeat(50));
    
    const filesPerVendor = await client.query(`
      SELECT 
        v.company_name,
        v.uuid as vendor_uuid,
        COUNT(ef.id) as evidence_count
      FROM vendors v
      LEFT JOIN evidence_files ef ON v.uuid = ef.vendor_id
      GROUP BY v.uuid, v.company_name
      HAVING COUNT(ef.id) > 0
      ORDER BY evidence_count DESC;
    `);
    
    console.log('Evidence files by vendor:');
    filesPerVendor.rows.forEach((vendor, index) => {
      console.log(`  ${index + 1}. ${vendor.company_name}: ${vendor.evidence_count} files`);
      console.log(`     Vendor UUID: ${vendor.vendor_uuid}`);
    });
    console.log();

    // 8. Identify the specific error case
    console.log('🚨 IDENTIFYING SPECIFIC ERROR CASES');
    console.log('='.repeat(50));
    
    const invalidUploaderFiles = await client.query(`
      SELECT id, vendor_id, original_filename, uploaded_by::text as uploaded_by_text, created_at
      FROM evidence_files
      WHERE uploaded_by::text = 'ai-system'
         OR (uploaded_by IS NOT NULL 
             AND uploaded_by::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
             AND uploaded_by::text NOT IN ('ai-generator', 'system'))
      ORDER BY created_at DESC;
    `);
    
    if (invalidUploaderFiles.rows.length > 0) {
      console.log(`❌ Found ${invalidUploaderFiles.rows.length} files with problematic uploaded_by values:`);
      invalidUploaderFiles.rows.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.original_filename}`);
        console.log(`     ID: ${file.id}`);
        console.log(`     Vendor ID: ${file.vendor_id}`);
        console.log(`     Uploaded by: "${file.uploaded_by_text}" ⚠️`);
        console.log(`     Created: ${file.created_at}`);
        console.log();
      });
    } else {
      console.log('✅ No files with problematic uploaded_by values found');
    }

    // 9. Suggest fixes
    console.log('💡 SUGGESTED FIXES');
    console.log('='.repeat(50));
    
    console.log('1. Update problematic uploaded_by values:');
    console.log(`   UPDATE evidence_files SET uploaded_by = 'ai-generator' WHERE uploaded_by = 'ai-system';`);
    console.log();
    
    console.log('2. Alternative: Make uploaded_by nullable and set to NULL for system uploads:');
    console.log(`   ALTER TABLE evidence_files ALTER COLUMN uploaded_by DROP NOT NULL;`);
    console.log(`   UPDATE evidence_files SET uploaded_by = NULL WHERE uploaded_by = 'ai-system';`);
    console.log();

    console.log('3. Backend code should use proper values:');
    console.log(`   - Use 'ai-generator' instead of 'ai-system'`);
    console.log(`   - Or use NULL if uploaded_by is nullable`);
    console.log(`   - Or use a valid user UUID`);

  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await client.end();
    console.log('\n🔚 Database connection closed');
  }
}

// Run the check
checkDatabase().catch(console.error); 