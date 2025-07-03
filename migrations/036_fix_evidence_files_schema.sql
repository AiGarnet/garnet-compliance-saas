-- Migration 036: Fix evidence_files table schema to match new entity
-- This updates the existing table structure to match our new requirements

BEGIN;

-- Drop the existing evidence_files table since it has a completely different structure
DROP TABLE IF EXISTS evidence_files CASCADE;

-- Create the new evidence_files table with the correct schema
CREATE TABLE evidence_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER,
    file_content TEXT,
    spaces_key VARCHAR(255),
    spaces_url VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_evidence_files_vendor_id ON evidence_files(vendor_id);
CREATE INDEX idx_evidence_files_uploaded_by ON evidence_files(uploaded_by);
CREATE INDEX idx_evidence_files_category ON evidence_files(category);
CREATE INDEX idx_evidence_files_upload_date ON evidence_files(upload_date);

-- Add foreign key constraint (if vendors table exists with UUID primary key)
-- ALTER TABLE evidence_files ADD CONSTRAINT fk_evidence_files_vendor_id 
-- FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;

COMMIT; 