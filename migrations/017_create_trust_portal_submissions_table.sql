-- Migration 017: Create trust_portal_submissions table
-- This table tracks questionnaire submissions from vendors to enterprises via Trust Portal

-- Create trust_portal_submissions table
CREATE TABLE IF NOT EXISTS trust_portal_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id INTEGER NOT NULL,
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
    CONSTRAINT fk_trust_portal_submissions_vendor 
        FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_trust_portal_submissions_vendor_id ON trust_portal_submissions(vendor_id);
CREATE INDEX idx_trust_portal_submissions_status ON trust_portal_submissions(status);
CREATE INDEX idx_trust_portal_submissions_submitted_at ON trust_portal_submissions(submitted_at);
CREATE INDEX idx_trust_portal_submissions_questionnaire_id ON trust_portal_submissions(questionnaire_id);

-- Add comments for documentation
COMMENT ON TABLE trust_portal_submissions IS 'Tracks questionnaire submissions from vendors to enterprises for review';
COMMENT ON COLUMN trust_portal_submissions.id IS 'Unique submission identifier';
COMMENT ON COLUMN trust_portal_submissions.vendor_id IS 'ID of the vendor submitting the questionnaire';
COMMENT ON COLUMN trust_portal_submissions.questionnaire_id IS 'ID of the submitted questionnaire';
COMMENT ON COLUMN trust_portal_submissions.status IS 'Submission status: IN_REVIEW, APPROVED, REJECTED, FOLLOW_ON_REQUESTED';
COMMENT ON COLUMN trust_portal_submissions.enterprise_email IS 'Email of the enterprise reviewer';
COMMENT ON COLUMN trust_portal_submissions.message IS 'Message from vendor to enterprise';
COMMENT ON COLUMN trust_portal_submissions.checklist_ids IS 'JSON array of associated checklist IDs';
COMMENT ON COLUMN trust_portal_submissions.submitted_at IS 'When the submission was made';
COMMENT ON COLUMN trust_portal_submissions.reviewed_at IS 'When the submission was first reviewed';
COMMENT ON COLUMN trust_portal_submissions.approved_at IS 'When the submission was approved';
COMMENT ON COLUMN trust_portal_submissions.reviewer_email IS 'Email of the person who reviewed';
COMMENT ON COLUMN trust_portal_submissions.reviewer_comments IS 'Comments from the reviewer';
COMMENT ON COLUMN trust_portal_submissions.follow_on_questionnaire_id IS 'ID of follow-on questionnaire if requested';

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Migration 017 completed: trust_portal_submissions table created successfully';
END $$; 