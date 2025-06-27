const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '015_add_digitalocean_spaces_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration 015: Add DigitalOcean Spaces fields...');
    
    // Execute migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration 015 completed successfully!');
    console.log('Added DigitalOcean Spaces fields to checklists and supporting documents tables');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

runMigration(); 