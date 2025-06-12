const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to database successfully');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'src', 'db', 'migrations', 'add_vendor_id_to_evidence_files.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: add_vendor_id_to_evidence_files.sql');
    
    // Execute the migration
    await client.query(migrationSQL);
    
    console.log('Migration completed successfully!');

    // Verify the changes
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'evidence_files'
      ORDER BY ordinal_position;
    `;
    
    const structure = await client.query(verifyQuery);
    console.log('\nUpdated evidence_files table structure:');
    structure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check constraints
    const constraintsQuery = `
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'evidence_files'
      AND constraint_type IN ('FOREIGN KEY', 'CHECK');
    `;
    
    const constraints = await client.query(constraintsQuery);
    console.log('\nConstraints on evidence_files table:');
    constraints.rows.forEach(row => {
      console.log(`- ${row.constraint_name}: ${row.constraint_type}`);
    });

  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

runMigration(); 