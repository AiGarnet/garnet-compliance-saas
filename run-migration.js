const { Client } = require('pg');
const fs = require('fs');

async function runMigration() {
  const client = new Client({
    connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway'
  });

  try {
    await client.connect();
    console.log('Connected to database...');
    
    // Read the migration file
    const migration = fs.readFileSync('migrations/033_add_user_organization_to_vendors.sql', 'utf8');
    
    // Execute the migration
    console.log('Running migration...');
    await client.query(migration);
    console.log('Migration completed successfully!');
    
    // Verify the changes
    console.log('\n=== VERIFYING MIGRATION ===');
    const vendorsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'vendors' 
      AND column_name IN ('created_by_user_id', 'organization_id')
      ORDER BY ordinal_position;
    `);
    console.log('New columns added:');
    console.table(vendorsColumns.rows);
    
    // Check sample data
    const vendors = await client.query(`
      SELECT vendor_id, company_name, organization_id, created_by_user_id 
      FROM vendors 
      LIMIT 3;
    `);
    console.log('\nSample vendor data after migration:');
    console.table(vendors.rows);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration(); 