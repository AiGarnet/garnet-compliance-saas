const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// PostgreSQL connection string
const connectionString = 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway';

async function runMigration() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false // For Railway deployment
    }
  });

  try {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '009_add_risk_score_to_vendors.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration 009_add_risk_score_to_vendors.sql...');
    
    // Execute the migration
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully');

    // Verify the results by checking the vendors table
    console.log('\nChecking current vendors with their risk scores:');
    const result = await client.query(`
      SELECT vendor_id, company_name, region, status, risk_score 
      FROM vendors 
      ORDER BY risk_score;
    `);

    if (result.rows.length > 0) {
      console.log('\n📊 Vendors with risk scores:');
      console.table(result.rows);
    } else {
      console.log('ℹ️ No vendors found in the database');
    }

    // Show table structure
    console.log('\n🔍 Vendors table structure:');
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'vendors' 
      ORDER BY ordinal_position;
    `);
    console.table(tableInfo.rows);

  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the migration
runMigration(); 