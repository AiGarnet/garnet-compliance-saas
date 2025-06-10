-- Rollback Migration: 20250609_create_questionnaires_table_rollback.sql
-- Description: Rollback questionnaires table creation
-- Author: System
-- Date: 2025-06-09

-- Drop the trigger first
DROP TRIGGER IF EXISTS update_vendor_answers_updated_at_trigger ON vendor_questionnaire_answers;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_vendor_answers_updated_at();

-- Drop the indexes
DROP INDEX IF EXISTS idx_vendor_answers_vendor_id;
DROP INDEX IF EXISTS idx_vendor_answers_question_id;

-- Drop the questionnaire answers table
DROP TABLE IF EXISTS vendor_questionnaire_answers CASCADE; 