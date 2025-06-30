const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Use the provided connection string
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway';

const pool = new Pool({ connectionString });

async function runMigration() {
  console.log('🚀 Running Migration 018: Database Schema Improvements...');
  
  try {
    const migrationPath = path.join(__dirname, '018_database_schema_improvements.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration in a transaction
    await pool.query('BEGIN');
    
    try {
      await pool.query(migrationSQL);
      await pool.query('COMMIT');
      console.log('✅ Migration 018 completed successfully!');
      console.log('📝 Database schema has been improved with better normalization and integrity');
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('❌ Migration 018 failed and was rolled back:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Migration 018 failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🎉 Migration 018 finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration 018 failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration }; 