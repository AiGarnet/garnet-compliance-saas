-- Migration 013: Add Performance Indexes
-- Purpose: Optimize database queries for vendor, questionnaire, and trust portal operations

-- Vendor table indexes
CREATE INDEX IF NOT EXISTS idx_vendors_company_name ON vendors(company_name);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_region ON vendors(region);
CREATE INDEX IF NOT EXISTS idx_vendors_industry ON vendors(industry);
CREATE INDEX IF NOT EXISTS idx_vendors_uuid ON vendors(uuid);
CREATE INDEX IF NOT EXISTS idx_vendors_contact_email ON vendors(contact_email);

-- Trust portal indexes
CREATE INDEX IF NOT EXISTS idx_trust_portal_items_vendor_id ON trust_portal_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_trust_portal_items_category ON trust_portal_items(category);
CREATE INDEX IF NOT EXISTS idx_trust_portal_shared_docs_vendor_id ON trust_portal_shared_documents(vendor_id);
CREATE INDEX IF NOT EXISTS idx_trust_portal_shared_docs_active ON trust_portal_shared_documents(is_active, share_to_trust_portal);

-- Questionnaire indexes (table is vendor_questionnaire_answers)
CREATE INDEX IF NOT EXISTS idx_vendor_questionnaire_answers_vendor_id ON vendor_questionnaire_answers(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_questionnaire_answers_question_id ON vendor_questionnaire_answers(question_id);

-- Vendor works indexes  
CREATE INDEX IF NOT EXISTS idx_vendor_works_vendor_id ON vendor_works(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_works_status ON vendor_works(status);

-- Vendor invite tokens indexes
CREATE INDEX IF NOT EXISTS idx_vendor_invite_tokens_vendor_id ON vendor_invite_tokens(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_invite_tokens_token ON vendor_invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_vendor_invite_tokens_used ON vendor_invite_tokens(used);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_vendors_status_created_at ON vendors(status, created_at);
CREATE INDEX IF NOT EXISTS idx_trust_portal_vendor_category ON trust_portal_items(vendor_id, category);
CREATE INDEX IF NOT EXISTS idx_activities_user_type_created ON activities(user_id, type, created_at);

-- Evidence files indexes
CREATE INDEX IF NOT EXISTS idx_evidence_files_vendor_id ON evidence_files(vendor_id);
CREATE INDEX IF NOT EXISTS idx_evidence_files_mime_type ON evidence_files(mime_type);
CREATE INDEX IF NOT EXISTS idx_evidence_files_answer_id ON evidence_files(answer_id);

COMMIT; 