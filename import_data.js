const fs = require('fs');
const { Pool } = require('pg');
const path = require('path');

// Configure PostgreSQL connection
const pool = new Pool({
  host: 'localhost',  // Server name
  port: 5432,
  database: 'garnet_ai',  // Database name
  user: 'postgres',
  password: 'Sonasuhani1'
});

async function importData() {
  try {
    // Read the JSON file
    const datasetPath = path.join(__dirname, 'Dataset.json');
    const rawData = fs.readFileSync(datasetPath, 'utf8');
    const frameworks = JSON.parse(rawData);
    
    console.log(`Found ${frameworks.length} compliance frameworks to import`);
    
    // Connect to the database
    const client = await pool.connect();
    
    try {
      // Import each framework
      let successCount = 0;
      
      for (const framework of frameworks) {
        // Create metadata JSON object
        const metadata = {
          description: framework.description || null,
          domains: framework.domains || [],
          region: framework.region || null
        };
        
        // Insert into the database
        const query = `
          INSERT INTO compliance_frameworks(name, type, jurisdiction, metadata)
          VALUES($1, $2, $3, $4)
          RETURNING id
        `;
        
        const values = [
          framework.name,
          framework.type || null,
          framework.jurisdiction || null,
          metadata
        ];
        
        const result = await client.query(query, values);
        successCount++;
        
        console.log(`Imported framework: ${framework.name} (ID: ${result.rows[0].id})`);
      }
      
      console.log(`Successfully imported ${successCount} of ${frameworks.length} compliance frameworks`);
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Error importing data:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the import function
importData(); 