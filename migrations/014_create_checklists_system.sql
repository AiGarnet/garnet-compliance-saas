-- Migration 014: Create Checklists System
-- Purpose: Add checklist storage with vendor-based data privacy
-- Ensures vendors can only access their own checklists and questions

-- Create checklists table for storing uploaded compliance checklists
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
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to vendors table
    CONSTRAINT fk_checklists_vendor_id 
        FOREIGN KEY (vendor_id) REFERENCES vendors(uuid) ON DELETE CASCADE,
    
    -- Ensure vendor can only access their own checklists
    CONSTRAINT unique_vendor_checklist_name 
        UNIQUE(vendor_id, name)
);

-- Create checklist_questions table for storing extracted questions
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
    
    -- Foreign keys
    CONSTRAINT fk_checklist_questions_checklist_id 
        FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE,
    CONSTRAINT fk_checklist_questions_vendor_id 
        FOREIGN KEY (vendor_id) REFERENCES vendors(uuid) ON DELETE CASCADE,
    
    -- Ensure vendor data privacy
    CONSTRAINT unique_vendor_question_order 
        UNIQUE(checklist_id, question_order)
);

-- Create checklist_supporting_documents table for document uploads
CREATE TABLE IF NOT EXISTS checklist_supporting_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL,
    vendor_id UUID NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    file_path TEXT, -- Will store S3/DO path later
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID REFERENCES users(id),
    
    -- Foreign keys
    CONSTRAINT fk_supporting_docs_question_id 
        FOREIGN KEY (question_id) REFERENCES checklist_questions(id) ON DELETE CASCADE,
    CONSTRAINT fk_supporting_docs_vendor_id 
        FOREIGN KEY (vendor_id) REFERENCES vendors(uuid) ON DELETE CASCADE
);

-- Performance indexes for vendor-based queries
CREATE INDEX IF NOT EXISTS idx_checklists_vendor_id ON checklists(vendor_id);
CREATE INDEX IF NOT EXISTS idx_checklists_status ON checklists(extraction_status);
CREATE INDEX IF NOT EXISTS idx_checklists_upload_date ON checklists(upload_date);

CREATE INDEX IF NOT EXISTS idx_checklist_questions_vendor_id ON checklist_questions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_checklist_questions_checklist_id ON checklist_questions(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_questions_status ON checklist_questions(status);
CREATE INDEX IF NOT EXISTS idx_checklist_questions_vendor_checklist ON checklist_questions(vendor_id, checklist_id);

CREATE INDEX IF NOT EXISTS idx_supporting_docs_vendor_id ON checklist_supporting_documents(vendor_id);
CREATE INDEX IF NOT EXISTS idx_supporting_docs_question_id ON checklist_supporting_documents(question_id);

-- Add comments for documentation
COMMENT ON TABLE checklists IS 'Stores uploaded compliance checklists with vendor-based data privacy';
COMMENT ON TABLE checklist_questions IS 'Stores extracted questions from checklists with AI answers';
COMMENT ON TABLE checklist_supporting_documents IS 'Stores supporting documents for questions';

-- Add row-level security policies for vendor data privacy
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_supporting_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies to ensure vendors can only access their own data
CREATE POLICY vendor_checklists_policy ON checklists
    FOR ALL USING (vendor_id = current_setting('app.current_vendor_id')::UUID);

CREATE POLICY vendor_questions_policy ON checklist_questions
    FOR ALL USING (vendor_id = current_setting('app.current_vendor_id')::UUID);

CREATE POLICY vendor_docs_policy ON checklist_supporting_documents
    FOR ALL USING (vendor_id = current_setting('app.current_vendor_id')::UUID); 