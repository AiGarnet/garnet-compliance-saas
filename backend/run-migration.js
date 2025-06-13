const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Running trust portal migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'src/db/migrations/20240320_create_trust_portal_items.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Trust portal migration completed successfully!');
    
    // Test the table creation
    const result = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'trust_portal_items'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Trust portal items table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration(); 