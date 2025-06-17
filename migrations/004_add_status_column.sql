-- Add status column to vendor_questionnaire_answers table
ALTER TABLE vendor_questionnaire_answers 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Pending';

-- Create index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_vendor_questionnaire_answers_status 
    ON vendor_questionnaire_answers(status);

-- Update existing records to have default status
UPDATE vendor_questionnaire_answers 
SET status = 'Pending' 
WHERE status IS NULL; 