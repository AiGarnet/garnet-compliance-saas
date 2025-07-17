-- Migration 043: Organization-Level Subscriptions
-- Purpose: Implement organization-level billing where subscription applies to entire organization

-- Create organization_subscriptions table
CREATE TABLE organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_price_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  plan_id VARCHAR(50) NOT NULL,
  billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_org_subscriptions_organization_id ON organization_subscriptions(organization_id);
CREATE INDEX idx_org_subscriptions_stripe_customer_id ON organization_subscriptions(stripe_customer_id);
CREATE INDEX idx_org_subscriptions_stripe_subscription_id ON organization_subscriptions(stripe_subscription_id);
CREATE INDEX idx_org_subscriptions_status ON organization_subscriptions(status);
CREATE INDEX idx_org_subscriptions_plan_id ON organization_subscriptions(plan_id);
CREATE INDEX idx_org_subscriptions_created_by ON organization_subscriptions(created_by_user_id);

-- Create unique constraint to prevent duplicate subscriptions per organization
CREATE UNIQUE INDEX idx_org_subscriptions_organization_stripe ON organization_subscriptions(organization_id, stripe_subscription_id);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_organization_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_organization_subscriptions_updated_at
  BEFORE UPDATE ON organization_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_subscriptions_updated_at();

-- Update organizations table to track subscription plan
ALTER TABLE organizations ADD COLUMN current_subscription_plan VARCHAR(50) DEFAULT 'starter';
ALTER TABLE organizations ADD COLUMN current_subscription_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE organizations ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for organization subscription fields
CREATE INDEX idx_organizations_subscription_plan ON organizations(current_subscription_plan);
CREATE INDEX idx_organizations_subscription_status ON organizations(current_subscription_status);
CREATE INDEX idx_organizations_subscription_expires ON organizations(subscription_expires_at);

-- Create a comprehensive view for organization subscription data
CREATE VIEW organization_subscription_details AS
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  o.domain as organization_domain,
  o.max_users,
  o.current_subscription_plan,
  o.current_subscription_status,
  o.subscription_expires_at,
  os.id as subscription_id,
  os.stripe_customer_id,
  os.stripe_subscription_id,
  os.stripe_price_id,
  os.status as stripe_status,
  os.plan_id,
  os.billing_cycle,
  os.current_period_start,
  os.current_period_end,
  os.created_by_user_id,
  u.email as created_by_email,
  u.full_name as created_by_name,
  os.created_at as subscription_created_at,
  os.updated_at as subscription_updated_at,
  COUNT(users.id) as current_user_count
FROM organizations o
LEFT JOIN organization_subscriptions os ON o.id = os.organization_id 
  AND os.status IN ('active', 'past_due')
LEFT JOIN users u ON os.created_by_user_id = u.id
LEFT JOIN users ON o.id = users.organization_id AND users.is_active = true
GROUP BY o.id, o.name, o.domain, o.max_users, o.current_subscription_plan, 
         o.current_subscription_status, o.subscription_expires_at,
         os.id, os.stripe_customer_id, os.stripe_subscription_id, 
         os.stripe_price_id, os.status, os.plan_id, os.billing_cycle,
         os.current_period_start, os.current_period_end, os.created_by_user_id,
         u.email, u.full_name, os.created_at, os.updated_at
ORDER BY o.created_at DESC;

-- Add comments for documentation
COMMENT ON TABLE organization_subscriptions IS 'Stores organization-level subscription data from Stripe';
COMMENT ON COLUMN organization_subscriptions.organization_id IS 'Reference to the organization that owns this subscription';
COMMENT ON COLUMN organization_subscriptions.stripe_customer_id IS 'Stripe customer ID for the organization';
COMMENT ON COLUMN organization_subscriptions.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN organization_subscriptions.stripe_price_id IS 'Stripe price ID for the subscription';
COMMENT ON COLUMN organization_subscriptions.status IS 'Subscription status: active, canceled, past_due, unpaid, incomplete';
COMMENT ON COLUMN organization_subscriptions.plan_id IS 'Plan identifier: starter, growth, scale, enterprise';
COMMENT ON COLUMN organization_subscriptions.billing_cycle IS 'Billing cycle: monthly or annual';
COMMENT ON COLUMN organization_subscriptions.created_by_user_id IS 'User who initiated the subscription';

COMMENT ON COLUMN organizations.current_subscription_plan IS 'Current subscription plan for the organization';
COMMENT ON COLUMN organizations.current_subscription_status IS 'Current subscription status for the organization';
COMMENT ON COLUMN organizations.subscription_expires_at IS 'When the current subscription period ends';

COMMENT ON VIEW organization_subscription_details IS 'Comprehensive view of organization subscription data with user counts';

-- Function to get organization subscription status
CREATE OR REPLACE FUNCTION get_organization_subscription_status(org_id UUID)
RETURNS TABLE(
  has_active_subscription BOOLEAN,
  plan_id VARCHAR(50),
  status VARCHAR(50),
  expires_at TIMESTAMP WITH TIME ZONE,
  user_count INTEGER,
  max_users INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN osd.stripe_status IN ('active', 'past_due') THEN true 
      ELSE false 
    END as has_active_subscription,
    COALESCE(osd.plan_id, 'starter') as plan_id,
    COALESCE(osd.stripe_status, 'inactive') as status,
    osd.current_period_end as expires_at,
    COALESCE(osd.current_user_count::INTEGER, 0) as user_count,
    osd.max_users
  FROM organization_subscription_details osd
  WHERE osd.organization_id = org_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_organization_subscription_status IS 'Helper function to check organization subscription status and limits'; 