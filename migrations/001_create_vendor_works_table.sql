-- Create vendor_works table for storing vendor work submissions
CREATE TABLE IF NOT EXISTS vendor_works (
    id UUID PRIMARY KEY,
    vendor_id INTEGER NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Completed',
    start_date DATE,
    end_date DATE,
    client_name VARCHAR(255),
    technologies JSONB DEFAULT '[]',
    category VARCHAR(100),
    share_to_trust_portal BOOLEAN DEFAULT false,
    evidence_files JSONB DEFAULT '[]',
    questionnaire_answers JSONB DEFAULT '[]',
    is_draft BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_vendor_works_vendor_id 
        FOREIGN KEY (vendor_id) 
        REFERENCES vendors(vendor_id) 
        ON DELETE CASCADE,
    
    CONSTRAINT chk_work_status 
        CHECK (status IN ('Completed', 'In Progress', 'Planned'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_works_vendor_id ON vendor_works(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_works_share_to_trust_portal ON vendor_works(share_to_trust_portal);
CREATE INDEX IF NOT EXISTS idx_vendor_works_is_draft ON vendor_works(is_draft);
CREATE INDEX IF NOT EXISTS idx_vendor_works_created_at ON vendor_works(created_at);

-- Add comment to table
COMMENT ON TABLE vendor_works IS 'Stores vendor work submissions and project details'; 