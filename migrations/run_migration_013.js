const { Pool } = require('pg');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  
  try {
    console.log('🔧 Running Migration 013: Performance Indexes...');
    
    // Read and execute the migration
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, 'migrations', '013_add_performance_indexes.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ Migration 013 completed successfully');
    console.log('📊 Added performance indexes to all core tables');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration 013 failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error); 