-- Migration 007: Add question_title column for better questionnaire naming
-- This will allow us to display questionnaires as {Vendor_name}-{question_title}

-- Step 1: Add question_title column
ALTER TABLE vendor_questionnaire_answers 
ADD COLUMN IF NOT EXISTS question_title VARCHAR(255);

-- Step 2: Update existing title records to extract the actual title
UPDATE vendor_questionnaire_answers 
SET question_title = answer
WHERE question = '__QUESTIONNAIRE_TITLE__' AND question_title IS NULL;

-- Step 3: Update regular question records to use a default title based on creation time
UPDATE vendor_questionnaire_answers 
SET question_title = CONCAT('Questionnaire_', EXTRACT(EPOCH FROM created_at)::bigint)
WHERE question != '__QUESTIONNAIRE_TITLE__' AND question_title IS NULL;

-- Step 4: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_questionnaire_answers_question_title 
    ON vendor_questionnaire_answers(question_title);

-- Step 5: Add comment for clarity
COMMENT ON COLUMN vendor_questionnaire_answers.question_title IS 'Title of the questionnaire for better display naming';

-- Step 6: Update constraints (optional - make question_title required for new records)
-- ALTER TABLE vendor_questionnaire_answers ALTER COLUMN question_title SET NOT NULL; 