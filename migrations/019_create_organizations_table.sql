-- Migration 019: Create Organizations Table and Connect Users
-- This will allow Founders and Sales Professionals to be connected via organization

-- Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255), -- Optional company domain for auto-assignment
  subscription_plan VARCHAR(50) DEFAULT 'basic', -- basic, pro, enterprise
  max_users INTEGER DEFAULT 10, -- Maximum users allowed
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}', -- Organization-specific settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add organization_id to users table
-- First, add the column as nullable
ALTER TABLE users ADD COLUMN organization_id UUID;

-- Add foreign key constraint
ALTER TABLE users 
ADD CONSTRAINT fk_users_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_organizations_name ON organizations(name);
CREATE INDEX idx_organizations_domain ON organizations(domain);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);
CREATE INDEX idx_users_organization_id ON users(organization_id);

-- Create trigger for updating organization updated_at
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_organizations_updated_at();

-- Insert some sample organizations for testing
INSERT INTO organizations (name, domain, max_users, settings) VALUES
(
  'GarnetAI Demo Organization',
  'garnetai.net',
  50,
  '{"features": ["compliance", "vendors", "questionnaires"], "theme": "default"}'
),
(
  'TechCorp Solutions',
  'techcorp.com',
  25,
  '{"features": ["compliance", "vendors"], "theme": "corporate"}'
),
(
  'StartupABC Inc',
  'startupabc.io',
  10,
  '{"features": ["compliance"], "theme": "minimal"}'
);

-- Update existing users to belong to the demo organization (optional)
-- This assigns all existing users to the first organization
UPDATE users 
SET organization_id = (SELECT id FROM organizations WHERE name = 'GarnetAI Demo Organization' LIMIT 1)
WHERE organization_id IS NULL;

-- Add comments for documentation
COMMENT ON TABLE organizations IS 'Organizations that group users together (Founders + Sales Professionals)';
COMMENT ON COLUMN organizations.name IS 'Organization name (company name)';
COMMENT ON COLUMN organizations.domain IS 'Company domain for auto-assignment of users';
COMMENT ON COLUMN organizations.subscription_plan IS 'Subscription tier: basic, pro, enterprise';
COMMENT ON COLUMN organizations.max_users IS 'Maximum number of users allowed in this organization';
COMMENT ON COLUMN organizations.settings IS 'Organization-specific settings and feature flags';
COMMENT ON COLUMN users.organization_id IS 'Links user to their organization';

-- Grant necessary permissions
-- GRANT SELECT, INSERT, UPDATE, DELETE ON organizations TO authenticated_user;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated_user; 