const { Client } = require('pg');
const fs = require('fs');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read the migration file
    const migrationSQL = fs.readFileSync('./migrations/012_add_used_column_to_vendor_invite_tokens.sql', 'utf8');

    // Execute the migration
    await client.query(migrationSQL);
    console.log('Migration 012 completed successfully - Added used column to vendor_invite_tokens table');

    await client.end();
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration(); 