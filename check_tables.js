const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway'
});

async function checkTables() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');
    
    const result = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'password_reset_tokens')
      ORDER BY table_name, ordinal_position
    `);
    
    console.log('\n📋 Database Tables Structure:');
    
    let currentTable = '';
    result.rows.forEach(row => {
      if (row.table_name !== currentTable) {
        console.log(`\n🔸 Table: ${row.table_name}`);
        currentTable = row.table_name;
      }
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkTables(); 