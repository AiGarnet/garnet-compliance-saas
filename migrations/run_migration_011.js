const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway'
});

async function runMigration() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    
    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, 'migrations', '011_create_trust_portal_feedback_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration 011: Create trust portal feedback system...');
    await client.query(migrationSQL);
    
    console.log('✅ Migration 011 completed successfully!');
    console.log('Created tables:');
    console.log('- trust_portal_feedback');
    console.log('- trust_portal_feedback_responses');
    console.log('- trust_portal_shared_documents');
    console.log('- Added indexes and triggers');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
  }
}

runMigration(); 