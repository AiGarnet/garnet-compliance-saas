-- Migration: add_has_suggestions_to_vendors.sql
-- Description: Add has_suggestions column to vendors table for AI suggestion tracking
-- Author: System
-- Date: 2025-01-09

-- Add has_suggestions column to vendors table
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS has_suggestions BOOLEAN DEFAULT FALSE;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_vendors_has_suggestions ON vendors(has_suggestions);

-- Add comment for documentation
COMMENT ON COLUMN vendors.has_suggestions IS 'Flag indicating if vendor has AI-generated questionnaire suggestions';

-- Update existing vendors with AI answers to set has_suggestions = true
UPDATE vendors 
SET has_suggestions = TRUE 
WHERE vendor_id IN (
  SELECT DISTINCT vendor_id 
  FROM vendor_questionnaire_answers 
  WHERE answer IS NOT NULL AND answer != ''
); 