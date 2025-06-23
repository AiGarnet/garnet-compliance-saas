-- Migration 011: Create trust portal feedback system
-- Create tables for trust portal feedback and communication

-- Create trust_portal_feedback table for enterprise feedback
CREATE TABLE IF NOT EXISTS trust_portal_feedback (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL,
    enterprise_contact_name VARCHAR(255),
    enterprise_contact_email VARCHAR(255) NOT NULL,
    enterprise_company_name VARCHAR(255),
    feedback_type VARCHAR(50) NOT NULL DEFAULT 'general',
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    invite_token VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_trust_portal_feedback_vendor_id 
        FOREIGN KEY (vendor_id) 
        REFERENCES vendors(vendor_id) 
        ON DELETE CASCADE,
    
    CONSTRAINT chk_feedback_type 
        CHECK (feedback_type IN ('general', 'document_request', 'clarification', 'compliance_issue', 'follow_up')),
        
    CONSTRAINT chk_feedback_status 
        CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
        
    CONSTRAINT chk_feedback_priority 
        CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

-- Create trust_portal_feedback_responses table for vendor responses to feedback
CREATE TABLE IF NOT EXISTS trust_portal_feedback_responses (
    id SERIAL PRIMARY KEY,
    feedback_id INTEGER NOT NULL,
    responder_type VARCHAR(20) NOT NULL DEFAULT 'vendor',
    responder_name VARCHAR(255),
    responder_email VARCHAR(255),
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    is_internal_note BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_feedback_responses_feedback_id 
        FOREIGN KEY (feedback_id) 
        REFERENCES trust_portal_feedback(id) 
        ON DELETE CASCADE,
        
    CONSTRAINT chk_responder_type 
        CHECK (responder_type IN ('vendor', 'enterprise', 'admin'))
);

-- Create trust_portal_shared_documents table for documents shared via trust portal
CREATE TABLE IF NOT EXISTS trust_portal_shared_documents (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL,
    document_title VARCHAR(255) NOT NULL,
    document_description TEXT,
    document_category VARCHAR(100) NOT NULL,
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    file_type VARCHAR(100),
    file_size BIGINT,
    is_evidence_file BOOLEAN DEFAULT false,
    is_questionnaire_answer BOOLEAN DEFAULT false,
    questionnaire_id VARCHAR(255),
    work_id UUID,
    share_to_trust_portal BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_trust_portal_docs_vendor_id 
        FOREIGN KEY (vendor_id) 
        REFERENCES vendors(vendor_id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_trust_portal_docs_work_id 
        FOREIGN KEY (work_id) 
        REFERENCES vendor_works(id) 
        ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trust_portal_feedback_vendor_id ON trust_portal_feedback(vendor_id);
CREATE INDEX IF NOT EXISTS idx_trust_portal_feedback_status ON trust_portal_feedback(status);
CREATE INDEX IF NOT EXISTS idx_trust_portal_feedback_created_at ON trust_portal_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_trust_portal_feedback_invite_token ON trust_portal_feedback(invite_token);

CREATE INDEX IF NOT EXISTS idx_feedback_responses_feedback_id ON trust_portal_feedback_responses(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_created_at ON trust_portal_feedback_responses(created_at);

CREATE INDEX IF NOT EXISTS idx_trust_portal_docs_vendor_id ON trust_portal_shared_documents(vendor_id);
CREATE INDEX IF NOT EXISTS idx_trust_portal_docs_is_active ON trust_portal_shared_documents(is_active);
CREATE INDEX IF NOT EXISTS idx_trust_portal_docs_category ON trust_portal_shared_documents(document_category);
CREATE INDEX IF NOT EXISTS idx_trust_portal_docs_share_to_trust_portal ON trust_portal_shared_documents(share_to_trust_portal);

-- Add comments to tables
COMMENT ON TABLE trust_portal_feedback IS 'Stores feedback and communication from enterprises to vendors via trust portal';
COMMENT ON TABLE trust_portal_feedback_responses IS 'Stores responses and communication thread for trust portal feedback';
COMMENT ON TABLE trust_portal_shared_documents IS 'Stores documents shared by vendors in their trust portal';

-- Create or update function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS trigger_trust_portal_feedback_updated_at ON trust_portal_feedback;
CREATE TRIGGER trigger_trust_portal_feedback_updated_at 
    BEFORE UPDATE ON trust_portal_feedback 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_trust_portal_docs_updated_at ON trust_portal_shared_documents;
CREATE TRIGGER trigger_trust_portal_docs_updated_at 
    BEFORE UPDATE ON trust_portal_shared_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 