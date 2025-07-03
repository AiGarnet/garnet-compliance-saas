-- Migration 037: Add missing uploaded_by column to evidence_files table

BEGIN;

-- Add the uploaded_by column
ALTER TABLE evidence_files 
ADD COLUMN uploaded_by UUID;

-- Create index for the uploaded_by column
CREATE INDEX idx_evidence_files_uploaded_by ON evidence_files(uploaded_by);

COMMIT; 