-- Rollback Migration: 20250609_create_vendors_table_rollback.sql
-- Description: Rollback vendors table creation
-- Author: System
-- Date: 2025-06-09

-- Drop the trigger first
DROP TRIGGER IF EXISTS update_vendors_updated_at_trigger ON vendors;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_vendors_updated_at();

-- Drop the indexes
DROP INDEX IF EXISTS idx_vendors_status;
DROP INDEX IF EXISTS idx_vendors_company_name;
DROP INDEX IF EXISTS idx_vendors_region;
DROP INDEX IF EXISTS idx_vendors_contact_email;
DROP INDEX IF EXISTS idx_vendors_uuid;

-- Drop the vendors table
DROP TABLE IF EXISTS vendors CASCADE; 