import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function completeSchema() {
  // Initial pool for testing connection
  const initialPool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'postgres', // Connect to postgres database first
    user: 'postgres',
    password: 'Sonasuhani1'
  });
  
  let client = null;
  let pool = null;
  
  try {
    console.log('Starting database schema creation...');
    
    // First, drop existing database and recreate it
    console.log('Attempting to drop and recreate database...');
    try {
      client = await initialPool.connect();
      
      // Check if any active connections to garnet_ai exist
      const activeConnsResult = await client.query(`
        SELECT count(*) FROM pg_stat_activity WHERE datname = 'garnet_ai'
      `);
      
      if (parseInt(activeConnsResult.rows[0].count) > 0) {
        // Force close connections
        await client.query(`
          SELECT pg_terminate_backend(pid) 
          FROM pg_stat_activity 
          WHERE datname = 'garnet_ai' AND pid <> pg_backend_pid()
        `);
        console.log('Terminated existing connections to the database');
      }
      
      // Drop the database if it exists
      await client.query(`DROP DATABASE IF EXISTS garnet_ai`);
      
      // Create the database
      await client.query(`CREATE DATABASE garnet_ai`);
      
      // Close admin connection
      client.release();
      await initialPool.end();
      
      console.log('Database dropped and recreated successfully.');
    } catch (err) {
      console.warn('Could not drop and recreate database. Continuing with existing database:', err.message);
      // Release client if it exists
      if (client) {
        client.release();
      }
      await initialPool.end();
    }
    
    // Connect to garnet_ai database
    pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'garnet_ai',
      user: 'postgres',
      password: 'Sonasuhani1'
    });
    
    client = await pool.connect();
    
    // First, drop existing tables to ensure clean creation
    console.log('Dropping existing tables if they exist...');
    await client.query(`
      DROP TABLE IF EXISTS 
        questionnaire_instances_y2023m12,
        evidence_files,
        answers,
        questionnaire_instances,
        questionnaire_templates,
        compliance_frameworks,
        users,
        audit_log
      CASCADE;
    `);
    
    // Create users table
    console.log('Creating users table...');
    await client.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL,
        organization TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_metadata ON users USING GIN (metadata);
    `);
    
    // Create the compliance_frameworks table
    console.log('Creating compliance_frameworks table...');
    await client.query(`
      CREATE TABLE compliance_frameworks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        jurisdiction TEXT,
        domains TEXT[],
        region TEXT,
        requirement TEXT,
        effective_date DATE,
        last_updated DATE,
        official_url TEXT,
        category TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_compliance_frameworks_name ON compliance_frameworks(name);
      CREATE INDEX idx_compliance_frameworks_type ON compliance_frameworks(type);
      CREATE INDEX idx_compliance_frameworks_jurisdiction ON compliance_frameworks(jurisdiction);
      CREATE INDEX idx_compliance_frameworks_domains ON compliance_frameworks USING GIN (domains);
      CREATE INDEX idx_compliance_frameworks_region ON compliance_frameworks(region);
      CREATE INDEX idx_compliance_frameworks_category ON compliance_frameworks(category);
    `);
    
    // Import data from data_new.json for compliance frameworks
    console.log('Importing compliance frameworks data from data_new.json...');
    try {
      const dataPath = path.resolve(__dirname, 'data_new.json');
      console.log(`Reading data from ${dataPath}`);
      const frameworksData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      console.log(`Found ${frameworksData.length} frameworks to import`);
      
      // Prepare the insert statement
      const insertQuery = `
        INSERT INTO compliance_frameworks 
        (name, type, description, jurisdiction, domains, region, requirement, 
         effective_date, last_updated, official_url, category)
        VALUES ($1, $2, $3, $4, $5::TEXT[], $6, $7, $8::DATE, $9::DATE, $10, $11)
      `;
      
      let successCount = 0;
      let errorCount = 0;
      
      // Helper function to validate and format date
      const formatDate = (dateStr) => {
        if (!dateStr) return null;
        
        // Try to parse the date
        try {
          // Handle various date formats
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateStr; // Already in YYYY-MM-DD format
          }
          
          // Try to convert YYYY-MM-DD with extra content
          const match = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
          if (match) {
            return match[1];
          }
          
          // Handle 'YYYY-MM-DD' format
          if (dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
            const parts = dateStr.split('-');
            return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          }
          
          // Try to parse as ISO date
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch (e) {
          console.warn(`Invalid date format: ${dateStr}`);
        }
        
        // Default to current date if parsing fails
        return new Date().toISOString().split('T')[0];
      };
      
      // Helper function to ensure domains is an array
      const formatDomains = (domains) => {
        if (!domains) return [];
        if (Array.isArray(domains)) return domains;
        if (typeof domains === 'string') {
          // Try to parse as JSON array if it's a string representation of an array
          try {
            const parsed = JSON.parse(domains);
            if (Array.isArray(parsed)) return parsed;
          } catch (e) {
            // If it's not a JSON array, treat it as a single domain
            return [domains];
          }
        }
        return [];
      };
      
      // Insert each framework
      for (const framework of frameworksData) {
        try {
          // Validate and sanitize framework data
          const sanitizedFramework = {
            name: framework.name || 'Unnamed Framework',
            type: framework.type || 'Unknown',
            description: framework.description || null,
            jurisdiction: framework.jurisdiction || null,
            domains: formatDomains(framework.domains),
            region: framework.region || null,
            requirement: framework.requirement || null,
            effective_date: formatDate(framework.effective_date),
            last_updated: formatDate(framework.last_updated),
            official_url: framework.official_url || null,
            category: framework.category || null
          };
          
          console.log(`Importing: ${sanitizedFramework.name}`);
          
          await client.query(insertQuery, [
            sanitizedFramework.name,
            sanitizedFramework.type,
            sanitizedFramework.description,
            sanitizedFramework.jurisdiction,
            sanitizedFramework.domains,
            sanitizedFramework.region,
            sanitizedFramework.requirement,
            sanitizedFramework.effective_date,
            sanitizedFramework.last_updated,
            sanitizedFramework.official_url,
            sanitizedFramework.category
          ]);
          
          successCount++;
        } catch (err) {
          errorCount++;
          console.error(`Error importing framework "${framework.name}":`, err.message);
          // Continue with the next framework
        }
      }
      
      console.log(`Import process completed. Successfully imported: ${successCount}, Failed: ${errorCount}`);
      const countResult = await client.query('SELECT COUNT(*) FROM compliance_frameworks');
      console.log(`Total frameworks in database: ${countResult.rows[0].count}`);
    } catch (error) {
      console.error('Error importing compliance frameworks:', error.message);
      console.error(error.stack);
    }
    
    // Create questionnaire_templates table
    console.log('Creating questionnaire_templates table...');
    await client.query(`
      CREATE TABLE questionnaire_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        version TEXT NOT NULL,
        framework_ids UUID[] DEFAULT '{}',
        structure JSONB NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_questionnaire_templates_framework_ids ON questionnaire_templates USING GIN (framework_ids);
      CREATE INDEX idx_questionnaire_templates_structure ON questionnaire_templates USING GIN (structure);
      
      -- Create a trigger function to check that framework IDs exist
      CREATE OR REPLACE FUNCTION check_framework_ids() RETURNS TRIGGER AS $$
      DECLARE
        framework_id UUID;
      BEGIN
        IF NEW.framework_ids IS NOT NULL THEN
          FOREACH framework_id IN ARRAY NEW.framework_ids
          LOOP
            IF NOT EXISTS (SELECT 1 FROM compliance_frameworks WHERE id = framework_id) THEN
              RAISE EXCEPTION 'Referenced framework with ID % does not exist', framework_id;
            END IF;
          END LOOP;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER check_framework_ids_trigger
      BEFORE INSERT OR UPDATE ON questionnaire_templates
      FOR EACH ROW
      EXECUTE FUNCTION check_framework_ids();
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
    // Safely release client if it exists
    if (client) {
      client.release();
    }
    
    // Close all pools
    if (pool) {
      await pool.end();
    }
  }
}

completeSchema();