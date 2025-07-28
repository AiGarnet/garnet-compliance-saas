-- Migration: Create coupons and coupon_usage tables
-- This migration adds support for coupon codes that can grant special access to features

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create coupon_usage table to track coupon usage
CREATE TABLE IF NOT EXISTS coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(coupon_id, user_id) -- Prevent duplicate usage of same coupon by same user
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON coupons(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_active ON coupon_usage(is_active);

-- Add comments for documentation
COMMENT ON TABLE coupons IS 'Stores coupon codes that can grant special access to features';
COMMENT ON COLUMN coupons.permissions IS 'JSONB field containing permissions granted by this coupon';
COMMENT ON COLUMN coupons.usage_limit IS 'Maximum number of times this coupon can be used (NULL = unlimited)';
COMMENT ON COLUMN coupons.usage_count IS 'Current number of times this coupon has been used';

COMMENT ON TABLE coupon_usage IS 'Tracks which users have used which coupons';
COMMENT ON COLUMN coupon_usage.expires_at IS 'When this coupon usage expires (NULL = never expires)';

-- Insert a sample testing coupon for development
INSERT INTO coupons (
    code, 
    name, 
    description, 
    permissions, 
    usage_limit, 
    valid_from, 
    valid_until,
    created_by
) VALUES (
    'BACKDOOR-TEST-2024',
    'Development Testing Coupon',
    'Backdoor coupon for development and testing - grants full access to all features',
    '{"full_access": true, "bypass_subscription": true, "testing_access": true, "unlimited_questionnaires": true, "unlimited_vendors": true, "unlimited_users": true, "unlimited_storage": true, "unlimited_frameworks": true, "plan_override": "enterprise"}'::jsonb,
    1000,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 year',
    (SELECT id FROM users WHERE email = 'admin@garnetai.net' LIMIT 1)
) ON CONFLICT (code) DO NOTHING; 