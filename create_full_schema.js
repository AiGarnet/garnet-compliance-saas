const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configure PostgreSQL connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'garnet_ai',
  user: 'postgres',
  password: 'Sonasuhani1'
});

async function createFullSchema() {
  const client = await pool.connect();
  
  try {
    console.log('Creating schema for vendor compliance platform...');
    
    // First, drop existing tables to start fresh (except compliance_frameworks)
    console.log('Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS 
        questionnaire_instances_y2023m12,
        evidence_files,
        answers,
        questionnaire_instances,
        questionnaire_templates,
        users,
        audit_log
      CASCADE;
      
      DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
      DROP FUNCTION IF EXISTS create_questionnaire_partitions_for_month() CASCADE;
      DROP VIEW IF EXISTS questionnaire_completion_stats CASCADE;
    `);
    
    // Create the required extensions
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);
    
    // First, backup existing compliance_frameworks data
    console.log('Backing up existing compliance_frameworks data...');
    await client.query(`
      CREATE TEMPORARY TABLE compliance_frameworks_backup AS
      SELECT * FROM compliance_frameworks;
    `);
    
    // Now, drop and recreate compliance_frameworks with UUID primary key
    console.log('Recreating compliance_frameworks table with UUID primary key...');
    await client.query(`
      DROP TABLE compliance_frameworks CASCADE;
      
      CREATE TABLE compliance_frameworks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        type TEXT,
        jurisdiction TEXT,
        version TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_compliance_frameworks_metadata ON compliance_frameworks USING GIN (metadata);
    `);
    
    // Reinsert data with new UUIDs
    console.log('Reinserting compliance frameworks data...');
    await client.query(`
      INSERT INTO compliance_frameworks (name, type, jurisdiction, metadata, created_at)
      SELECT 
        name, 
        type, 
        jurisdiction, 
        CASE 
          WHEN metadata IS NULL THEN '{}'::jsonb 
          ELSE metadata 
        END,
        COALESCE(created_at, CURRENT_TIMESTAMP)
      FROM compliance_frameworks_backup;
    `);
    
    // Create users table
    console.log('Creating users table...');
    await client.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        role TEXT NOT NULL,
        preferences JSONB DEFAULT '{}'::jsonb,
        is_active BOOLEAN DEFAULT TRUE,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_users_preferences ON users USING GIN (preferences);
    `);
    
    // Create questionnaire_templates table
    console.log('Creating questionnaire_templates table...');
    await client.query(`
      CREATE TABLE questionnaire_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        framework_id UUID NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        version TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        questions JSONB NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_questionnaire_templates_questions ON questionnaire_templates USING GIN (questions);
      CREATE INDEX idx_questionnaire_templates_metadata ON questionnaire_templates USING GIN (metadata);
    `);
    
    // Create questionnaire_instances table with partitioning
    console.log('Creating questionnaire_instances table...');
    await client.query(`
      CREATE TABLE questionnaire_instances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) PARTITION BY RANGE (started_at);
      
      CREATE INDEX idx_questionnaire_instances_metadata ON questionnaire_instances USING GIN (metadata);
      
      CREATE TABLE questionnaire_instances_y2023m12 PARTITION OF questionnaire_instances
        FOR VALUES FROM ('2023-12-01') TO ('2024-01-01');
    `);
    
    // Create answers table
    console.log('Creating answers table...');
    await client.query(`
      CREATE TABLE answers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        questionnaire_id UUID NOT NULL REFERENCES questionnaire_instances(id) ON DELETE CASCADE,
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
    
    // Create triggers and functions
    console.log('Creating triggers and functions...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_compliance_frameworks_updated_at BEFORE UPDATE ON compliance_frameworks
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_questionnaire_templates_updated_at BEFORE UPDATE ON questionnaire_templates
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_questionnaire_instances_updated_at BEFORE UPDATE ON questionnaire_instances
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON answers
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_evidence_files_updated_at BEFORE UPDATE ON evidence_files
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    
    // Create the view and function for partitioning
    console.log('Creating views and partition management function...');
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
    
    console.log('Schema created successfully!');
    console.log('The following tables were created:');
    
    // Get all tables in the database to confirm
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
    console.error('Error creating schema:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

createFullSchema(); 