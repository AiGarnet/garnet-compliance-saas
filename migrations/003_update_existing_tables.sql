-- Add share_to_trust_portal column to vendor_questionnaire_answers table
ALTER TABLE vendor_questionnaire_answers 
ADD COLUMN IF NOT EXISTS share_to_trust_portal BOOLEAN DEFAULT false;

-- Add work_id column to vendor_questionnaire_answers table
ALTER TABLE vendor_questionnaire_answers 
ADD COLUMN IF NOT EXISTS work_id UUID;

-- Add answer column to vendor_questionnaire_answers table if it doesn't exist
ALTER TABLE vendor_questionnaire_answers 
ADD COLUMN IF NOT EXISTS answer TEXT DEFAULT '';

-- Add share_to_trust_portal column to evidence files table (if it exists)
-- Note: This assumes there's an evidence_files table - adjust table name as needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'evidence_files') THEN
        ALTER TABLE evidence_files 
        ADD COLUMN IF NOT EXISTS share_to_trust_portal BOOLEAN DEFAULT false;
        
        ALTER TABLE evidence_files 
        ADD COLUMN IF NOT EXISTS work_id UUID;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_questionnaire_answers_share_to_trust_portal 
    ON vendor_questionnaire_answers(share_to_trust_portal);

CREATE INDEX IF NOT EXISTS idx_vendor_questionnaire_answers_work_id 
    ON vendor_questionnaire_answers(work_id);

-- Add foreign key constraint for work_id if vendor_works table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_works') THEN
        ALTER TABLE vendor_questionnaire_answers 
        ADD CONSTRAINT fk_vendor_questionnaire_answers_work_id 
        FOREIGN KEY (work_id) REFERENCES vendor_works(id) ON DELETE SET NULL;
    END IF;
END $$; 