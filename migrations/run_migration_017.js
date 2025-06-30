const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: process.env.DB_USER || 'garnet_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'garnet_compliance_db',
  password: process.env.DB_PASSWORD || 'garnet_secure_pass',
  port: process.env.DB_PORT || 5432,
});

async function runMigration() {
  console.log('🚀 Running Migration 017: Create trust_portal_submissions table...');
  
  try {
    const migrationPath = path.join(__dirname, '017_create_trust_portal_submissions_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    console.log('✅ Migration 017 completed successfully!');
    console.log('📝 Created trust_portal_submissions table for tracking questionnaire submissions');
    
  } catch (error) {
    console.error('❌ Migration 017 failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🎉 Migration 017 finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration 017 failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration }; 