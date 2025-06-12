-- Migration: Add vendor_id to evidence_files table
-- This allows direct vendor-evidence relationship for general vendor file uploads

-- Add vendor_id column to evidence_files table
ALTER TABLE evidence_files 
ADD COLUMN vendor_id INTEGER;

-- Add foreign key constraint to vendors table
ALTER TABLE evidence_files 
ADD CONSTRAINT fk_evidence_files_vendor_id 
FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) 
ON DELETE CASCADE;

-- Create index for performance on vendor_id lookups
CREATE INDEX idx_evidence_files_vendor_id ON evidence_files(vendor_id);

-- Make answer_id nullable since we now support vendor-level uploads not tied to specific answers
ALTER TABLE evidence_files 
ALTER COLUMN answer_id DROP NOT NULL;

-- Add a check constraint to ensure either vendor_id or answer_id is provided
ALTER TABLE evidence_files 
ADD CONSTRAINT chk_evidence_files_relationship 
CHECK (vendor_id IS NOT NULL OR answer_id IS NOT NULL);

-- Create index for combined vendor and answer lookups
CREATE INDEX idx_evidence_files_vendor_answer ON evidence_files(vendor_id, answer_id);

-- Add comment to document the change
COMMENT ON COLUMN evidence_files.vendor_id IS 'Direct relationship to vendor for general vendor evidence uploads';
COMMENT ON COLUMN evidence_files.answer_id IS 'Relationship to specific questionnaire answer (optional)'; 