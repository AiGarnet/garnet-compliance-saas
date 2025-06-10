-- Migration: 20250609_create_vendors_table.sql
-- Description: Create vendors table with proper constraints and field naming
-- Author: System
-- Date: 2025-06-09

-- Enable UUID extension for additional UUID fields if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if the old vendors table exists and rename it for data migration
DO $$
BEGIN
    -- If old vendors table exists with different schema, backup the data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendors') THEN
        -- Check if it has the old schema (has 'name' column instead of 'company_name')
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'name') 
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'company_name') THEN
            -- Rename old table to backup
            EXECUTE 'ALTER TABLE vendors RENAME TO vendors_backup_' || to_char(NOW(), 'YYYYMMDD_HH24MISS');
            RAISE NOTICE 'Old vendors table backed up for data migration';
        END IF;
    END IF;
END $$;

-- Create vendors table with auto-increment primary key and proper constraints
CREATE TABLE IF NOT EXISTS vendors (
    -- Primary key as auto-increment integer
    vendor_id SERIAL PRIMARY KEY,
    
    -- Core company information
    company_name VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL DEFAULT 'Global',
    
    -- Contact and web presence
    contact_name VARCHAR(255),
    contact_email VARCHAR(255) UNIQUE NOT NULL,
    website VARCHAR(500),
    
    -- Business details
    industry VARCHAR(255),
    description TEXT,
    
    -- Status and risk assessment
    status VARCHAR(50) NOT NULL DEFAULT 'Questionnaire Pending',
    risk_score INTEGER DEFAULT 50,
    risk_level VARCHAR(20) DEFAULT 'Medium',
    
    -- Additional UUID field for external references (optional)
    uuid UUID DEFAULT uuid_generate_v4(),
    
    -- Timestamps with proper defaults
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Migrate data from backup table if it exists
DO $$
DECLARE
    backup_table_name TEXT;
BEGIN
    -- Find the backup table
    SELECT table_name INTO backup_table_name
    FROM information_schema.tables 
    WHERE table_name LIKE 'vendors_backup_%'
    ORDER BY table_name DESC
    LIMIT 1;
    
    IF backup_table_name IS NOT NULL THEN
        RAISE NOTICE 'Migrating data from % to new vendors table', backup_table_name;
        
        -- Migrate data with field mapping
        EXECUTE format('
            INSERT INTO vendors (company_name, region, contact_name, contact_email, website, industry, description, status, risk_score, risk_level, uuid, created_at, updated_at)
            SELECT 
                name as company_name,
                COALESCE(''Global'') as region,
                contact_name,
                COALESCE(contact_email, ''contact@'' || LOWER(REPLACE(name, '' '', '''')) || ''.com'') as contact_email,
                website,
                industry,
                description,
                status,
                risk_score,
                risk_level,
                COALESCE(id::UUID, uuid_generate_v4()) as uuid,
                created_at,
                updated_at
            FROM %I
            ON CONFLICT (contact_email) DO NOTHING
        ', backup_table_name);
        
        RAISE NOTICE 'Data migration completed from %', backup_table_name;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_company_name ON vendors(company_name);
CREATE INDEX IF NOT EXISTS idx_vendors_region ON vendors(region);
CREATE INDEX IF NOT EXISTS idx_vendors_contact_email ON vendors(contact_email);
CREATE INDEX IF NOT EXISTS idx_vendors_uuid ON vendors(uuid);

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS update_vendors_updated_at_trigger ON vendors;
CREATE TRIGGER update_vendors_updated_at_trigger
    BEFORE UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_vendors_updated_at();

-- Add comments for documentation
COMMENT ON TABLE vendors IS 'Vendor companies with compliance and risk information';
COMMENT ON COLUMN vendors.vendor_id IS 'Auto-increment primary key for vendors';
COMMENT ON COLUMN vendors.company_name IS 'Official company name (required)';
COMMENT ON COLUMN vendors.region IS 'Geographic region of the vendor (required)';
COMMENT ON COLUMN vendors.contact_email IS 'Primary contact email (unique, required)';
COMMENT ON COLUMN vendors.uuid IS 'UUID for external API references';
COMMENT ON COLUMN vendors.status IS 'Current status in the vendor approval process';
COMMENT ON COLUMN vendors.risk_score IS 'Numerical risk score (0-100)';
COMMENT ON COLUMN vendors.risk_level IS 'Categorical risk level (Low/Medium/High)'; 