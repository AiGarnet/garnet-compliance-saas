-- Migration 015: Add DigitalOcean Spaces fields
-- Add Spaces integration fields to checklists table

ALTER TABLE checklists 
ADD COLUMN spaces_key TEXT,
ADD COLUMN spaces_url TEXT;

-- Add Spaces integration fields to checklist_supporting_documents table
ALTER TABLE checklist_supporting_documents 
ADD COLUMN spaces_key TEXT,
ADD COLUMN spaces_url TEXT;

-- Add indexes for better performance
CREATE INDEX idx_checklists_spaces_key ON checklists(spaces_key);
CREATE INDEX idx_supporting_docs_spaces_key ON checklist_supporting_documents(spaces_key);

-- Add comments for documentation
COMMENT ON COLUMN checklists.spaces_key IS 'DigitalOcean Spaces object key for the uploaded checklist JSON';
COMMENT ON COLUMN checklists.spaces_url IS 'Direct URL to the checklist file in DigitalOcean Spaces';
COMMENT ON COLUMN checklist_supporting_documents.spaces_key IS 'DigitalOcean Spaces object key for the uploaded supporting document';
COMMENT ON COLUMN checklist_supporting_documents.spaces_url IS 'Direct URL to the supporting document in DigitalOcean Spaces'; 