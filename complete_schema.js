const { Pool } = require('pg');

// Configure PostgreSQL connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'garnet_ai',
  user: 'postgres',
  password: 'Sonasuhani1'
});

async function completeSchema() {
  const client = await pool.connect();
  
  try {
    console.log('Adding remaining tables to the schema...');
    
    // First, drop existing tables to ensure clean creation
    console.log('Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS 
        questionnaire_instances_y2023m12,
        evidence_files,
        answers,
        questionnaire_instances,
        audit_log
      CASCADE;
    `);
    
    // Create questionnaire_instances table with partitioning
    console.log('Creating questionnaire_instances table...');
    await client.query(`
      CREATE TABLE questionnaire_instances (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        template_id UUID NOT NULL REFERENCES questionnaire_templates(id),
        vendor_id UUID NOT NULL REFERENCES users(id),
        assessor_id UUID REFERENCES users(id),
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'in_progress',
        started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        due_date TIMESTAMP,
        metadata JSONB DEFAULT '{}'::jsonb,
        progress REAL DEFAULT 0.0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id, started_at)
      ) PARTITION BY RANGE (started_at);
      
      CREATE INDEX idx_questionnaire_instances_metadata ON questionnaire_instances USING GIN (metadata);
      CREATE INDEX idx_questionnaire_instances_id ON questionnaire_instances (id);
    `);
    
    // Create partition
    console.log('Creating partition for questionnaire_instances...');
    await client.query(`
      CREATE TABLE questionnaire_instances_y2023m12 
        PARTITION OF questionnaire_instances
        FOR VALUES FROM ('2023-12-01') TO ('2024-01-01');
    `);
    
    // Create answers table
    console.log('Creating answers table...');
    await client.query(`
      CREATE TABLE answers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        questionnaire_id UUID NOT NULL,
        question_id TEXT NOT NULL,
        response JSONB NOT NULL,
        compliance_status TEXT,
        evidence_ids UUID[] DEFAULT '{}',
        reviewer_id UUID REFERENCES users(id),
        reviewed_at TIMESTAMP,
        reviewer_notes TEXT,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_answers_response ON answers USING GIN (response);
      CREATE INDEX idx_answers_question_id ON answers (question_id);
      CREATE INDEX idx_answers_evidence_ids ON answers USING GIN (evidence_ids);
      CREATE INDEX idx_answers_questionnaire_id ON answers(questionnaire_id);
    `);
    
    // Create evidence_files table
    console.log('Creating evidence_files table...');
    await client.query(`
      CREATE TABLE evidence_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        answer_id UUID REFERENCES answers(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type TEXT NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        uploaded_by UUID NOT NULL REFERENCES users(id),
        uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expiry_date TIMESTAMP,
        is_archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_evidence_files_metadata ON evidence_files USING GIN (metadata);
      CREATE INDEX idx_evidence_files_answer_id ON evidence_files(answer_id);
    `);
    
    // Create audit_log table
    console.log('Creating audit_log table...');
    await client.query(`
      CREATE TABLE audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id UUID,
        previous_state JSONB,
        new_state JSONB,
        ip_address TEXT,
        user_agent TEXT,
        event_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        additional_data JSONB
      );
      
      CREATE INDEX idx_audit_log_previous_state ON audit_log USING GIN (previous_state);
      CREATE INDEX idx_audit_log_new_state ON audit_log USING GIN (new_state);
      CREATE INDEX idx_audit_log_additional_data ON audit_log USING GIN (additional_data);
      CREATE INDEX idx_audit_log_entity ON audit_log (entity_type, entity_id);
      CREATE INDEX idx_audit_log_user_action ON audit_log (user_id, action);
      CREATE INDEX idx_audit_log_event_time ON audit_log (event_time DESC);
    `);
    
    // Instead of a direct foreign key, create a function to check foreign keys
    console.log('Creating foreign key check function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION check_questionnaire_exists() RETURNS TRIGGER AS $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM questionnaire_instances WHERE id = NEW.questionnaire_id) THEN
          RAISE EXCEPTION 'Referenced questionnaire with ID % does not exist', NEW.questionnaire_id;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER check_questionnaire_exists_trigger
      BEFORE INSERT OR UPDATE ON answers
      FOR EACH ROW
      EXECUTE FUNCTION check_questionnaire_exists();
    `);
    
    // Create triggers and functions for updated_at
    console.log('Creating triggers and functions for timestamps...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      CREATE TRIGGER update_questionnaire_instances_updated_at BEFORE UPDATE ON questionnaire_instances
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON answers
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_evidence_files_updated_at BEFORE UPDATE ON evidence_files
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      -- Make sure the triggers exist on our existing tables too
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      DROP TRIGGER IF EXISTS update_compliance_frameworks_updated_at ON compliance_frameworks;
      DROP TRIGGER IF EXISTS update_questionnaire_templates_updated_at ON questionnaire_templates;
      
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_compliance_frameworks_updated_at BEFORE UPDATE ON compliance_frameworks
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_questionnaire_templates_updated_at BEFORE UPDATE ON questionnaire_templates
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    
    // Create the view and function for partitioning
    console.log('Creating view and partition management function...');
    await client.query(`
      CREATE OR REPLACE VIEW questionnaire_completion_stats AS
      SELECT 
          qi.id,
          qi.name,
          qi.status,
          qi.vendor_id,
          u.email as vendor_email,
          qi.started_at,
          qi.due_date,
          qi.progress,
          COUNT(a.id) as total_answers,
          SUM(CASE WHEN a.compliance_status = 'compliant' THEN 1 ELSE 0 END) as compliant_count,
          SUM(CASE WHEN a.compliance_status = 'non_compliant' THEN 1 ELSE 0 END) as non_compliant_count,
          SUM(CASE WHEN a.compliance_status = 'partial' THEN 1 ELSE 0 END) as partial_count,
          SUM(CASE WHEN a.compliance_status = 'na' THEN 1 ELSE 0 END) as na_count,
          COUNT(DISTINCT e.id) as evidence_count
      FROM 
          questionnaire_instances qi
      JOIN 
          users u ON qi.vendor_id = u.id
      LEFT JOIN 
          answers a ON qi.id = a.questionnaire_id
      LEFT JOIN 
          evidence_files e ON e.id = ANY(a.evidence_ids)
      GROUP BY 
          qi.id, qi.name, qi.status, qi.vendor_id, u.email, qi.started_at, qi.due_date, qi.progress;
      
      CREATE OR REPLACE FUNCTION create_questionnaire_partitions_for_month()
      RETURNS void AS $$
      DECLARE
          next_month DATE;
          partition_name TEXT;
          start_date TEXT;
          end_date TEXT;
      BEGIN
          next_month := date_trunc('month', CURRENT_DATE + INTERVAL '1 month');
          
          partition_name := 'questionnaire_instances_y' || 
                            to_char(next_month, 'YYYY') || 
                            'm' || 
                            to_char(next_month, 'MM');
          
          start_date := to_char(next_month, 'YYYY-MM-DD');
          end_date := to_char(next_month + INTERVAL '1 month', 'YYYY-MM-DD');
          
          PERFORM 1
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relname = partition_name AND n.nspname = 'public';
          
          IF NOT FOUND THEN
              EXECUTE format(
                  'CREATE TABLE %I PARTITION OF questionnaire_instances FOR VALUES FROM (%L) TO (%L)',
                  partition_name, start_date, end_date
              );
              
              RAISE NOTICE 'Created partition % for range % to %', 
                            partition_name, start_date, end_date;
          END IF;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('Schema completed successfully!');
    console.log('Checking all tables in the schema:');
    
    // Get all tables to confirm
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' 
      AND table_type='BASE TABLE'
      ORDER BY table_name;
    `);
    
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('Error completing schema:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

completeSchema(); 