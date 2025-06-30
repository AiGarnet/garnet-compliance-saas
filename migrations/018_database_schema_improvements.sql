-- Migration 018: Database Schema Improvements
-- Purpose: Improve database schema for better normalization, consistency, and integrity

-- 1. Fix inconsistent primary key types across tables
-- Some tables use UUID, others use integers, standardize where possible

-- 2. Fix vendors table to ensure consistent primary key
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE vendors SET uuid = gen_random_uuid() WHERE uuid IS NULL;
ALTER TABLE vendors ALTER COLUMN uuid SET NOT NULL;
ALTER TABLE vendors ADD CONSTRAINT unique_vendor_uuid UNIQUE (uuid);

-- 3. Add missing foreign key constraints where applicable
ALTER TABLE vendor_works
    DROP CONSTRAINT IF EXISTS fk_vendor_works_vendor,
    ADD CONSTRAINT fk_vendor_works_vendor
        FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE;

-- 4. Add missing indexes for performance improvement
CREATE INDEX IF NOT EXISTS idx_vendor_works_vendor_id ON vendor_works(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_questionnaire_answers_vendor_id ON vendor_questionnaire_answers(vendor_id);

-- 5. Add missing timestamp columns to tables that need them
ALTER TABLE audit_log 
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE checklist_supporting_documents 
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE vendor_invite_tokens 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE trust_portal_feedback_responses 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE waitlist 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 6. Add NOT NULL constraints to critical columns
ALTER TABLE vendors ALTER COLUMN company_name SET NOT NULL;
ALTER TABLE vendors ALTER COLUMN contact_email SET NOT NULL;
ALTER TABLE vendors ALTER COLUMN status SET NOT NULL;

-- 7. Add check constraints for enum values
ALTER TABLE vendors
    ADD CONSTRAINT check_vendor_status CHECK (
        status IN ('Questionnaire Pending', 'In Review', 'Pending Review', 'Approved')
    );

-- 8. Add documentation comments
COMMENT ON TABLE vendors IS 'Stores vendor/partner company information';
COMMENT ON TABLE vendor_works IS 'Stores vendor project/work submissions';
COMMENT ON TABLE vendor_questionnaire_answers IS 'Stores answers to questionnaire questions';
COMMENT ON TABLE checklists IS 'Stores uploaded compliance checklists';
COMMENT ON TABLE checklist_questions IS 'Stores questions extracted from checklists';
COMMENT ON TABLE checklist_supporting_documents IS 'Stores supporting documents for checklist questions';
COMMENT ON TABLE activities IS 'Audit log of all system activities';

-- 9. Create trust_portal_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS trust_portal_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id INTEGER NOT NULL,
    vendor_uuid UUID NOT NULL,
    questionnaire_id TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_REVIEW',
    enterprise_email VARCHAR(255),
    message TEXT,
    checklist_ids JSONB,
    submitted_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    approved_at TIMESTAMP,
    reviewer_email VARCHAR(255),
    reviewer_comments TEXT,
    follow_on_questionnaire_id TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_trust_portal_submissions_vendor_id 
        FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    CONSTRAINT fk_trust_portal_submissions_vendor_uuid
        FOREIGN KEY (vendor_uuid) REFERENCES vendors(uuid) ON DELETE CASCADE
);

-- Create indexes for better performance on trust_portal_submissions
CREATE INDEX IF NOT EXISTS idx_trust_portal_submissions_vendor_id ON trust_portal_submissions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_trust_portal_submissions_vendor_uuid ON trust_portal_submissions(vendor_uuid);
CREATE INDEX IF NOT EXISTS idx_trust_portal_submissions_status ON trust_portal_submissions(status);
CREATE INDEX IF NOT EXISTS idx_trust_portal_submissions_submitted_at ON trust_portal_submissions(submitted_at);

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Migration 018 completed: Database schema improvements applied successfully';
END $$; 