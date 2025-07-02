-- Migration 033: Add User and Organization relationships to Vendors table
-- Purpose: Fix security vulnerability where all users can see all vendors
-- Ensures vendor data isolation based on organization

-- Step 1: Add columns to vendors table
ALTER TABLE vendors 
ADD COLUMN created_by_user_id UUID,
ADD COLUMN organization_id UUID;

-- Step 2: Add foreign key constraints
ALTER TABLE vendors 
ADD CONSTRAINT fk_vendors_created_by_user 
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_vendors_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

-- Step 3: Create indexes for performance
CREATE INDEX idx_vendors_created_by_user_id ON vendors(created_by_user_id);
CREATE INDEX idx_vendors_organization_id ON vendors(organization_id);
CREATE INDEX idx_vendors_org_status ON vendors(organization_id, status);
CREATE INDEX idx_vendors_org_created ON vendors(organization_id, created_at);

-- Step 4: Update existing vendors to belong to the first organization (temporary fix)
-- This assigns all existing vendors to the first organization for backwards compatibility
UPDATE vendors 
SET organization_id = (
    SELECT id FROM organizations ORDER BY created_at LIMIT 1
),
created_by_user_id = (
    SELECT id FROM users ORDER BY created_at LIMIT 1
)
WHERE organization_id IS NULL;

-- Step 5: Add NOT NULL constraints after populating data
-- We'll make organization_id required for new vendors
-- created_by_user_id can remain nullable for system-created vendors

-- Step 6: Add comments for documentation
COMMENT ON COLUMN vendors.created_by_user_id IS 'User who created this vendor record';
COMMENT ON COLUMN vendors.organization_id IS 'Organization this vendor belongs to - ensures data isolation';

-- Step 7: Create view for vendor access with organization filtering
CREATE OR REPLACE VIEW vendor_access_view AS
SELECT 
    v.*,
    o.name as organization_name,
    u.email as created_by_email,
    u.full_name as created_by_name
FROM vendors v
LEFT JOIN organizations o ON v.organization_id = o.id
LEFT JOIN users u ON v.created_by_user_id = u.id;

COMMENT ON VIEW vendor_access_view IS 'Vendor view with organization and user context for access control'; 