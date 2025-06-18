-- Migration 005: Simplify questionnaire structure
-- Remove redundant questionnaire_id and work_id columns
-- Keep question_id as the primary identifier for each question-answer pair

-- First, let's see what data we have
-- SELECT questionnaire_id, question_id, question, COUNT(*) 
-- FROM vendor_questionnaire_answers 
-- GROUP BY questionnaire_id, question_id, question;

-- Step 1: Drop foreign key constraint for work_id if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_vendor_questionnaire_answers_work_id'
    ) THEN
        ALTER TABLE vendor_questionnaire_answers 
        DROP CONSTRAINT fk_vendor_questionnaire_answers_work_id;
    END IF;
END $$;

-- Step 2: Drop work_id column (as requested)
ALTER TABLE vendor_questionnaire_answers 
DROP COLUMN IF EXISTS work_id;

-- Step 3: Add a questionnaire_group column to replace questionnaire_id
-- This will group questions into questionnaires by timestamp/batch
ALTER TABLE vendor_questionnaire_answers 
ADD COLUMN IF NOT EXISTS questionnaire_group BIGINT;

-- Step 4: Migrate existing questionnaire_id data to questionnaire_group
UPDATE vendor_questionnaire_answers 
SET questionnaire_group = questionnaire_id 
WHERE questionnaire_group IS NULL AND questionnaire_id IS NOT NULL;

-- Step 5: Drop the old questionnaire_id column
ALTER TABLE vendor_questionnaire_answers 
DROP COLUMN IF EXISTS questionnaire_id;

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_questionnaire_answers_question_id 
    ON vendor_questionnaire_answers(question_id);

CREATE INDEX IF NOT EXISTS idx_vendor_questionnaire_answers_questionnaire_group 
    ON vendor_questionnaire_answers(questionnaire_group);

CREATE INDEX IF NOT EXISTS idx_vendor_questionnaire_answers_vendor_group 
    ON vendor_questionnaire_answers(vendor_id, questionnaire_group);

-- Step 7: Drop old indexes that are no longer needed
DROP INDEX IF EXISTS idx_vendor_questionnaire_answers_work_id;

-- Step 8: Add comments for clarity
COMMENT ON COLUMN vendor_questionnaire_answers.question_id IS 'Unique identifier for each question-answer pair';
COMMENT ON COLUMN vendor_questionnaire_answers.questionnaire_group IS 'Groups questions into questionnaires (timestamp-based)';
COMMENT ON COLUMN vendor_questionnaire_answers.vendor_id IS 'Links to the vendor who provided the answers';

-- Step 9: Update any special title records to use new structure
UPDATE vendor_questionnaire_answers 
SET question_id = CONCAT('TITLE_', questionnaire_group)
WHERE question = '__QUESTIONNAIRE_TITLE__' AND question_id != CONCAT('TITLE_', questionnaire_group); 