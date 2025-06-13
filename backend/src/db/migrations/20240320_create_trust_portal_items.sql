-- Migration: 20240320_create_trust_portal_items.sql
-- Description: Create trust portal items table to store vendor evidence and questionnaire answers
-- Author: System
-- Date: 2024-03-20

CREATE TABLE IF NOT EXISTS trust_portal_items (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    file_url TEXT,
    file_type VARCHAR(50),
    file_size VARCHAR(50),
    content TEXT,
    is_questionnaire_answer BOOLEAN DEFAULT false,
    questionnaire_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_trust_portal_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trust_portal_items_updated_at_trigger
    BEFORE UPDATE ON trust_portal_items
    FOR EACH ROW
    EXECUTE FUNCTION update_trust_portal_items_updated_at();

-- Add indexes
CREATE INDEX idx_trust_portal_items_vendor_id ON trust_portal_items(vendor_id);
CREATE INDEX idx_trust_portal_items_category ON trust_portal_items(category); 