-- Migration 016: Add Supporting Document Metadata Fields
-- Purpose: Add description and category fields for standalone supporting document uploads

-- Add description and category fields to checklist_supporting_documents table
ALTER TABLE checklist_supporting_documents 
ADD COLUMN description TEXT,
ADD COLUMN category VARCHAR(50) DEFAULT 'General';

-- Add index for category searches
CREATE INDEX idx_supporting_docs_category ON checklist_supporting_documents(category);

-- Add comments for documentation
COMMENT ON COLUMN checklist_supporting_documents.description IS 'User-provided description of the supporting document';
COMMENT ON COLUMN checklist_supporting_documents.category IS 'Category classification for the document (Security, Compliance, Privacy, etc.)';

-- Update existing documents to have default category
UPDATE checklist_supporting_documents 
SET category = 'General' 
WHERE category IS NULL; 