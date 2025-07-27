-- Migration: Add document detection confidence and reason fields
-- Date: 2024-01-XX
-- Description: Add requiresDocumentConfidenceScore and requiresDocumentReason fields to checklist_questions table

-- Add new columns for enhanced document detection
ALTER TABLE checklist_questions 
ADD COLUMN requires_document_confidence_score DECIMAL(3,2) NULL;

ALTER TABLE checklist_questions 
ADD COLUMN requires_document_reason TEXT NULL;

-- Create index for performance on confidence score queries
CREATE INDEX IF NOT EXISTS idx_checklist_questions_confidence_score 
ON checklist_questions(requires_document_confidence_score);

-- Update existing records with default values
UPDATE checklist_questions 
SET 
    requires_document_confidence_score = CASE 
        WHEN requires_document = true THEN 0.8 
        ELSE 0.2 
    END,
    requires_document_reason = CASE 
        WHEN requires_document = true THEN 'Legacy record - manual review required'
        ELSE 'Legacy record - no document required'
    END
WHERE requires_document_confidence_score IS NULL; 