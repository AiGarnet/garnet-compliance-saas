const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read migration file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', '014_create_checklists_system.sql'), 
      'utf8'
    );

    // Execute migration
    await client.query(migrationSQL);
    console.log('Migration 014 executed successfully');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('checklists', 'checklist_questions', 'checklist_supporting_documents')
      ORDER BY table_name;
    `);

    console.log('Created tables:', result.rows.map(row => row.table_name));

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration(); 