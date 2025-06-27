const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// PostgreSQL connection string
const connectionString = 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway';

async function runMigration() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '010_add_risk_level_to_vendors.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration 010_add_risk_level_to_vendors.sql...');
    
    // Execute the migration
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully');

    // Verify the results
    console.log('\nChecking vendors with risk scores and levels:');
    const result = await client.query(`
      SELECT vendor_id, company_name, risk_score, risk_level 
      FROM vendors 
      ORDER BY risk_score;
    `);

    if (result.rows.length > 0) {
      console.log('\n📊 Vendors with risk scores and levels:');
      console.table(result.rows);
    }

  } catch (error) {
    console.error('❌ Error running migration:', error.message);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

runMigration(); 