-- Migration 006: Ultra-simple structure
-- Remove questionnaire_group completely
-- Link questions directly to vendors via vendor_id and question_id

-- Step 1: Drop questionnaire_group column completely
ALTER TABLE vendor_questionnaire_answers 
DROP COLUMN IF EXISTS questionnaire_group;

-- Step 2: Create optimized indexes for the new simple structure
CREATE INDEX IF NOT EXISTS idx_vendor_questionnaire_answers_vendor_question 
    ON vendor_questionnaire_answers(vendor_id, question_id);

CREATE INDEX IF NOT EXISTS idx_vendor_questionnaire_answers_vendor_id 
    ON vendor_questionnaire_answers(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_questionnaire_answers_question_id_unique 
    ON vendor_questionnaire_answers(question_id);

-- Step 3: Drop old indexes that are no longer needed
DROP INDEX IF EXISTS idx_vendor_questionnaire_answers_questionnaire_group;
DROP INDEX IF EXISTS idx_vendor_questionnaire_answers_vendor_group;

-- Step 4: Add comments for clarity
COMMENT ON COLUMN vendor_questionnaire_answers.question_id IS 'Unique identifier for each question-answer pair';
COMMENT ON COLUMN vendor_questionnaire_answers.vendor_id IS 'Links question directly to vendor';
COMMENT ON TABLE vendor_questionnaire_answers IS 'Simple structure: each question linked directly to vendor via vendor_id + question_id';

-- Step 5: Update title records to use simple question_id format
UPDATE vendor_questionnaire_answers 
SET question_id = CONCAT('TITLE_', EXTRACT(EPOCH FROM created_at)::bigint)
WHERE question = '__QUESTIONNAIRE_TITLE__' AND question_id NOT LIKE 'TITLE_%'; 