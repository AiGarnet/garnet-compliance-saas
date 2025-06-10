-- Migration: 20250609_create_questionnaires_table.sql
-- Description: Create questionnaires and related tables
-- Author: System
-- Date: 2025-06-09

-- First, check if the old questionnaire table exists and needs migration
DO $$
BEGIN
    -- If old vendor_questionnaire_answers table exists with UUID vendor_id
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_questionnaire_answers') THEN
        -- Check if it has UUID vendor_id instead of INTEGER
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'vendor_questionnaire_answers' 
                  AND column_name = 'vendor_id' 
                  AND data_type = 'uuid') THEN
            -- Backup the old table
            EXECUTE 'ALTER TABLE vendor_questionnaire_answers RENAME TO vendor_questionnaire_answers_backup_' || to_char(NOW(), 'YYYYMMDD_HH24MISS');
            RAISE NOTICE 'Old vendor_questionnaire_answers table backed up for migration';
        END IF;
    END IF;
END $$;

-- Create vendor_questionnaire_answers table for storing questionnaire responses
CREATE TABLE IF NOT EXISTS vendor_questionnaire_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id INTEGER NOT NULL,
    question_id VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vendor_id, question_id)
);

-- Migrate data from backup table if it exists
DO $$
DECLARE
    backup_table_name TEXT;
BEGIN
    -- Find the backup table
    SELECT table_name INTO backup_table_name
    FROM information_schema.tables 
    WHERE table_name LIKE 'vendor_questionnaire_answers_backup_%'
    ORDER BY table_name DESC
    LIMIT 1;
    
    IF backup_table_name IS NOT NULL THEN
        RAISE NOTICE 'Migrating questionnaire answers from % to new table', backup_table_name;
        
        -- Migrate data by joining with vendors table to get the new vendor_id
        EXECUTE format('
            INSERT INTO vendor_questionnaire_answers (vendor_id, question_id, question, answer, created_at, updated_at)
            SELECT 
                v.vendor_id,
                old.question_id,
                old.question,
                old.answer,
                old.created_at,
                old.updated_at
            FROM %I old
            INNER JOIN vendors v ON v.uuid = old.vendor_id
            ON CONFLICT (vendor_id, question_id) DO NOTHING
        ', backup_table_name);
        
        RAISE NOTICE 'Questionnaire answers migration completed from %', backup_table_name;
    END IF;
END $$;

-- Add foreign key constraint to vendors table (only if it doesn't exist)
-- Note: This assumes vendors table exists with vendor_id as primary key
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_vendor_questionnaire_answers_vendor_id'
        AND table_name = 'vendor_questionnaire_answers'
    ) THEN
        ALTER TABLE vendor_questionnaire_answers 
        ADD CONSTRAINT fk_vendor_questionnaire_answers_vendor_id 
        FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_vendor_answers_vendor_id ON vendor_questionnaire_answers(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_answers_question_id ON vendor_questionnaire_answers(question_id);

-- Create trigger for updated_at timestamp (replace if exists)
CREATE OR REPLACE FUNCTION update_vendor_answers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_vendor_answers_updated_at_trigger ON vendor_questionnaire_answers;
CREATE TRIGGER update_vendor_answers_updated_at_trigger
    BEFORE UPDATE ON vendor_questionnaire_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_answers_updated_at();

-- Add comments for documentation
COMMENT ON TABLE vendor_questionnaire_answers IS 'Questionnaire answers provided by vendors';
COMMENT ON COLUMN vendor_questionnaire_answers.vendor_id IS 'Reference to vendor table (vendor_id)';
COMMENT ON COLUMN vendor_questionnaire_answers.question_id IS 'Unique identifier for the question';
COMMENT ON COLUMN vendor_questionnaire_answers.question IS 'The actual question text';
COMMENT ON COLUMN vendor_questionnaire_answers.answer IS 'The vendor''s answer to the question'; 