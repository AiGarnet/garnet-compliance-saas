-- Install required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the users table
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

-- Create GIN index for JSONB preferences
CREATE INDEX idx_users_preferences ON users USING GIN (preferences);

-- Create the compliance_frameworks table
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

-- Create GIN index for JSONB metadata
CREATE INDEX idx_compliance_frameworks_metadata ON compliance_frameworks USING GIN (metadata);

-- Create the questionnaire_templates table
CREATE TABLE questionnaire_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id UUID NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    version TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, published, archived
    questions JSONB NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create GIN indexes for JSONB columns
CREATE INDEX idx_questionnaire_templates_questions ON questionnaire_templates USING GIN (questions);
CREATE INDEX idx_questionnaire_templates_metadata ON questionnaire_templates USING GIN (metadata);

-- Create the partition table for questionnaire_instances
CREATE TABLE questionnaire_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES questionnaire_templates(id),
    vendor_id UUID NOT NULL REFERENCES users(id),
    assessor_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, completed, reviewed, approved, rejected
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    due_date TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    progress REAL DEFAULT 0.0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (started_at);

-- Create GIN index for JSONB metadata
CREATE INDEX idx_questionnaire_instances_metadata ON questionnaire_instances USING GIN (metadata);

-- Create one example monthly partition
CREATE TABLE questionnaire_instances_y2023m12 PARTITION OF questionnaire_instances
    FOR VALUES FROM ('2023-12-01') TO ('2024-01-01');

-- Create the answers table
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    questionnaire_id UUID NOT NULL REFERENCES questionnaire_instances(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    response JSONB NOT NULL,
    compliance_status TEXT, -- compliant, non_compliant, partial, na
    evidence_ids UUID[] DEFAULT '{}',
    reviewer_id UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    reviewer_notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create GIN index for JSONB response
CREATE INDEX idx_answers_response ON answers USING GIN (response);
-- Create index for question_id (frequently queried)
CREATE INDEX idx_answers_question_id ON answers (question_id);
-- Create index for array of evidence_ids
CREATE INDEX idx_answers_evidence_ids ON answers USING GIN (evidence_ids);

-- Create the evidence_files table
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

-- Create GIN index for JSONB metadata
CREATE INDEX idx_evidence_files_metadata ON evidence_files USING GIN (metadata);

-- Create the audit_log table
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

-- Create GIN indexes for JSONB columns
CREATE INDEX idx_audit_log_previous_state ON audit_log USING GIN (previous_state);
CREATE INDEX idx_audit_log_new_state ON audit_log USING GIN (new_state);
CREATE INDEX idx_audit_log_additional_data ON audit_log USING GIN (additional_data);

-- Create indexes for common query patterns
CREATE INDEX idx_audit_log_entity ON audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_log_user_action ON audit_log (user_id, action);
CREATE INDEX idx_audit_log_event_time ON audit_log (event_time DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
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

-- Add additional useful views

-- View for questionnaire completion stats
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

-- Function to create new monthly partitions automatically
CREATE OR REPLACE FUNCTION create_questionnaire_partitions_for_month()
RETURNS void AS $$
DECLARE
    next_month DATE;
    partition_name TEXT;
    start_date TEXT;
    end_date TEXT;
BEGIN
    -- Calculate the start of next month
    next_month := date_trunc('month', CURRENT_DATE + INTERVAL '1 month');
    
    -- Generate partition name (e.g., questionnaire_instances_y2023m01)
    partition_name := 'questionnaire_instances_y' || 
                      to_char(next_month, 'YYYY') || 
                      'm' || 
                      to_char(next_month, 'MM');
    
    -- Format dates for the partition range
    start_date := to_char(next_month, 'YYYY-MM-DD');
    end_date := to_char(next_month + INTERVAL '1 month', 'YYYY-MM-DD');
    
    -- Check if the partition already exists
    PERFORM 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = partition_name AND n.nspname = 'public';
    
    -- Create the partition if it doesn't exist
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

-- Create a comment on the schema
COMMENT ON DATABASE garnet_ai IS 'Vendor compliance platform database for Garnet AI SaaS platform'; 