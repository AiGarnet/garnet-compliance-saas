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

    // Get migration file from command line argument
    const migrationFile = process.argv[2];
    if (!migrationFile) {
      throw new Error('Please provide a migration file path as an argument');
    }

    // Read migration file
    const migrationPath = path.isAbsolute(migrationFile) 
      ? migrationFile 
      : path.join(__dirname, '..', migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    console.log(`Applying migration: ${migrationPath}`);
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