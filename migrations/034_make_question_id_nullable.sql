-- Migration 034: Make question_id nullable for standalone documents
-- Purpose: Allow supporting documents to be uploaded independently without being linked to specific questions

-- First, drop the foreign key constraint
ALTER TABLE checklist_supporting_documents 
DROP CONSTRAINT IF EXISTS fk_supporting_docs_question_id;

-- Make question_id nullable to support standalone documents
ALTER TABLE checklist_supporting_documents 
ALTER COLUMN question_id DROP NOT NULL;

-- Clean up orphaned records (set question_id to NULL where the referenced question doesn't exist)
UPDATE checklist_supporting_documents 
SET question_id = NULL 
WHERE question_id IS NOT NULL 
AND question_id NOT IN (SELECT id FROM checklist_questions);

-- Add new constraint that allows null question_id
ALTER TABLE checklist_supporting_documents 
ADD CONSTRAINT fk_supporting_docs_question_id 
    FOREIGN KEY (question_id) REFERENCES checklist_questions(id) ON DELETE CASCADE;

-- Add comment for documentation
COMMENT ON COLUMN checklist_supporting_documents.question_id IS 'Optional reference to a specific question. NULL for standalone documents.'; 