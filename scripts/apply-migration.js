const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection configuration
const config = {
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: {
    rejectUnauthorized: false
  }
};

async function applyMigration() {
  const client = new Client(config);
  
  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', '040_create_vendor_invite_tokens_and_feedback.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    await client.query(migrationSQL);
    console.log('Migration applied successfully');

  } catch (error) {
    console.error('Error applying migration:', error);
    throw error;
  } finally {
    // Close database connection
    await client.end();
    console.log('Database connection closed');
  }
}

// Run migration
applyMigration().catch(console.error); 