-- Migration 035: Create evidence files table
-- Purpose: Add evidence files storage for internal vendor files used to enhance AI response generation

-- Create evidence_files table for storing vendor evidence files
CREATE TABLE IF NOT EXISTS evidence_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER,
    file_content TEXT,
    spaces_key TEXT,
    spaces_url TEXT,
    description TEXT,
    category VARCHAR(100),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_evidence_files_vendor_id 
        FOREIGN KEY (vendor_id) REFERENCES vendors(uuid) ON DELETE CASCADE
);

-- Performance indexes for vendor-based queries
CREATE INDEX IF NOT EXISTS idx_evidence_files_vendor_id ON evidence_files(vendor_id); 