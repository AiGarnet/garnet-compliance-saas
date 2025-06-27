const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupChecklistTables() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Create checklists table
    await client.query(`
      CREATE TABLE IF NOT EXISTS checklists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vendor_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size INTEGER,
        original_filename VARCHAR(255),
        file_content TEXT,
        extraction_status VARCHAR(20) DEFAULT 'pending',
        question_count INTEGER DEFAULT 0,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        uploaded_by UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_vendor_checklist_name UNIQUE(vendor_id, name)
      );
    `);
    console.log('Created checklists table');

    // Create checklist_questions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS checklist_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        checklist_id UUID NOT NULL,
        vendor_id UUID NOT NULL,
        question_text TEXT NOT NULL,
        question_order INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        ai_answer TEXT,
        confidence_score DECIMAL(3,2),
        requires_document BOOLEAN DEFAULT false,
        document_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_vendor_question_order UNIQUE(checklist_id, question_order)
      );
    `);
    console.log('Created checklist_questions table');

    // Create supporting documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS checklist_supporting_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID NOT NULL,
        vendor_id UUID NOT NULL,
        filename VARCHAR(255) NOT NULL,
        file_type VARCHAR(50),
        file_size INTEGER,
        file_path TEXT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        uploaded_by UUID
      );
    `);
    console.log('Created checklist_supporting_documents table');

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_checklists_vendor_id ON checklists(vendor_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_checklist_questions_vendor_id ON checklist_questions(vendor_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_checklist_questions_checklist_id ON checklist_questions(checklist_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_supporting_docs_vendor_id ON checklist_supporting_documents(vendor_id);');
    console.log('Created indexes');

    // Verify tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'checklist%'
      ORDER BY table_name;
    `);

    console.log('✅ Successfully created checklist tables:', result.rows.map(r => r.table_name));

  } catch (error) {
    console.error('❌ Failed to setup checklist tables:', error.message);
  } finally {
    await client.end();
  }
}

setupChecklistTables(); 