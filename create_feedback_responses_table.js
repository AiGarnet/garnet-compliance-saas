const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway'
});

async function createFeedbackResponsesTable() {
  try {
    await client.connect();
    console.log('🔍 Creating feedback_responses table...');
    
    const createResponsesTableQuery = `
      CREATE TABLE IF NOT EXISTS feedback_responses (
        id SERIAL PRIMARY KEY,
        feedback_id INTEGER NOT NULL,
        responder_type VARCHAR(20) NOT NULL DEFAULT 'VENDOR',
        responder_name VARCHAR(255),
        responder_email VARCHAR(255),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feedback_id) REFERENCES trust_portal_feedback(id) ON DELETE CASCADE
      );
    `;
    
    await client.query(createResponsesTableQuery);
    console.log('✅ Created feedback_responses table');

    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_responses_feedback_id ON feedback_responses(feedback_id);
    `;
    
    await client.query(createIndexQuery);
    console.log('✅ Created feedback_responses index');
    
    console.log('🎉 Feedback responses table setup completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.');
  }
}

createFeedbackResponsesTable(); 