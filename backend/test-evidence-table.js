const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkEvidenceTable() {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to database successfully');

    // Check if evidence_files table exists
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'evidence_files'
      );
    `;
    
    const tableExists = await client.query(tableCheckQuery);
    console.log('Evidence files table exists:', tableExists.rows[0].exists);

    if (tableExists.rows[0].exists) {
      // Get table structure
      const structureQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'evidence_files'
        ORDER BY ordinal_position;
      `;
      
      const structure = await client.query(structureQuery);
      console.log('\nEvidence files table structure:');
      structure.rows.forEach(row => {
        console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });

      // Check sample data
      const sampleQuery = 'SELECT COUNT(*) FROM evidence_files;';
      const count = await client.query(sampleQuery);
      console.log(`\nTotal evidence files in database: ${count.rows[0].count}`);
    } else {
      console.log('\nEvidence files table does not exist. Need to create it.');
    }

    // Check vendors table structure for reference
    const vendorTableQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'vendors'
      ORDER BY ordinal_position;
    `;
    
    const vendorStructure = await client.query(vendorTableQuery);
    console.log('\nVendors table structure (for reference):');
    vendorStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

checkEvidenceTable(); 