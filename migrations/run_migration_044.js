const { Client } = require('pg');
const fs = require('fs');

// Database connection string from the user
const connectionString = 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway';

async function runMigration() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to database');

    // Read the migration file
    const migrationSQL = fs.readFileSync('./044_create_password_reset_tokens_table.sql', 'utf8');
    
    console.log('Running migration: Create password reset tokens table...');
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully');

    // Verify the table was created
    const result = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'password_reset_tokens' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Table structure:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration }; 