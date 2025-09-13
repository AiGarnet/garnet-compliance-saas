-- Migration to increase file_type column length in checklists table
-- This fixes the "value too long for type character varying(50)" error
-- for files with long MIME types like Excel files

-- Increase file_type column length from 50 to 100 characters
ALTER TABLE checklists ALTER COLUMN file_type TYPE VARCHAR(100);

-- Also update other tables that might have the same constraint
ALTER TABLE checklist_supporting_documents ALTER COLUMN file_type TYPE VARCHAR(100);
ALTER TABLE evidence_files ALTER COLUMN file_type TYPE VARCHAR(100);

-- Add index for file_type for better query performance
CREATE INDEX IF NOT EXISTS idx_checklists_file_type ON checklists(file_type);
CREATE INDEX IF NOT EXISTS idx_supporting_docs_file_type ON checklist_supporting_documents(file_type);
CREATE INDEX IF NOT EXISTS idx_evidence_files_file_type ON evidence_files(file_type);

-- Update any existing records that might have been truncated
-- This is safe because we're only expanding the column size
COMMENT ON COLUMN checklists.file_type IS 'File MIME type or short format (up to 100 chars)';
COMMENT ON COLUMN checklist_supporting_documents.file_type IS 'File MIME type or short format (up to 100 chars)';
COMMENT ON COLUMN evidence_files.file_type IS 'File MIME type or short format (up to 100 chars)';
