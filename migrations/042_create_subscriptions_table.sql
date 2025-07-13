-- Migration 042: Create Subscriptions Table for Stripe Integration
-- Purpose: Store user subscription data and manage billing with Stripe

-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255) NOT NULL,
  stripe_price_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  plan_id VARCHAR(50) NOT NULL,
  billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_current_period_end ON subscriptions(current_period_end);

-- Create unique constraint to prevent duplicate subscriptions
CREATE UNIQUE INDEX idx_subscriptions_user_stripe_subscription ON subscriptions(user_id, stripe_subscription_id);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Add subscription_plan column to users table for quick access
ALTER TABLE users ADD COLUMN subscription_plan VARCHAR(50) DEFAULT 'starter';
ALTER TABLE users ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'active';

-- Create index for user subscription plan
CREATE INDEX idx_users_subscription_plan ON users(subscription_plan);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);

-- Add comments for documentation
COMMENT ON TABLE subscriptions IS 'Stores user subscription data from Stripe';
COMMENT ON COLUMN subscriptions.user_id IS 'Reference to the user who owns this subscription';
COMMENT ON COLUMN subscriptions.stripe_customer_id IS 'Stripe customer ID';
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN subscriptions.stripe_price_id IS 'Stripe price ID for the subscription';
COMMENT ON COLUMN subscriptions.status IS 'Subscription status: active, canceled, past_due, unpaid, incomplete';
COMMENT ON COLUMN subscriptions.plan_id IS 'Plan identifier: starter, growth, scale, enterprise';
COMMENT ON COLUMN subscriptions.billing_cycle IS 'Billing cycle: monthly or annual';
COMMENT ON COLUMN subscriptions.current_period_start IS 'Current billing period start date';
COMMENT ON COLUMN subscriptions.current_period_end IS 'Current billing period end date';

COMMENT ON COLUMN users.subscription_plan IS 'Current subscription plan for quick access';
COMMENT ON COLUMN users.subscription_status IS 'Current subscription status for quick access';

-- Create a view for easy subscription queries
CREATE VIEW user_subscriptions AS
SELECT 
  u.id as user_id,
  u.email,
  u.full_name,
  u.subscription_plan,
  u.subscription_status,
  s.id as subscription_id,
  s.stripe_customer_id,
  s.stripe_subscription_id,
  s.stripe_price_id,
  s.plan_id,
  s.billing_cycle,
  s.current_period_start,
  s.current_period_end,
  s.created_at as subscription_created_at,
  s.updated_at as subscription_updated_at
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id 
  AND s.status IN ('active', 'past_due')
ORDER BY s.created_at DESC;

COMMENT ON VIEW user_subscriptions IS 'View combining user and subscription data for easy querying'; 