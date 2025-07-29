-- Migration 051: Add Stripe Coupons Table and Early Bird Coupon
-- Purpose: Create separate table for Stripe coupons and add early bird promotion

-- Create stripe_coupons table (separate from existing backdoor coupons table)
CREATE TABLE IF NOT EXISTS stripe_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_coupon_id VARCHAR(255) UNIQUE NOT NULL, -- Stripe coupon ID (promo_xxx)
    code VARCHAR(50) UNIQUE NOT NULL, -- Display code for frontend
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'amount')),
    discount_value DECIMAL(10,2) NOT NULL, -- percentage (0-100) or amount in cents
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stripe_coupons_code ON stripe_coupons(code);
CREATE INDEX IF NOT EXISTS idx_stripe_coupons_stripe_id ON stripe_coupons(stripe_coupon_id);
CREATE INDEX IF NOT EXISTS idx_stripe_coupons_active ON stripe_coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_stripe_coupons_valid_dates ON stripe_coupons(valid_from, valid_until);

-- Add trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_stripe_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_stripe_coupons_updated_at
  BEFORE UPDATE ON stripe_coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_stripe_coupons_updated_at();

-- Insert the early bird Stripe coupon
INSERT INTO stripe_coupons (
  stripe_coupon_id,
  code,
  name,
  description,
  discount_type,
  discount_value,
  usage_limit,
  usage_count,
  valid_from,
  valid_until,
  is_active
) VALUES (
  'promo_1Rq72ZGCn6F00HoY4tEzyrHf',
  'EARLYBIRDOFF',
  'Early Bird 100% Off',
  'Special early bird access offer providing 100% discount on all plans',
  'percentage',
  100.00,
  1000,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '90 days',
  true
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  stripe_coupon_id = EXCLUDED.stripe_coupon_id,
  updated_at = CURRENT_TIMESTAMP;

-- Add comments for documentation
COMMENT ON TABLE stripe_coupons IS 'Stores Stripe coupon/promotion codes for billing discounts';
COMMENT ON COLUMN stripe_coupons.stripe_coupon_id IS 'The actual Stripe coupon/promotion ID (e.g., promo_xxx)';
COMMENT ON COLUMN stripe_coupons.code IS 'User-friendly coupon code displayed in frontend';
COMMENT ON COLUMN stripe_coupons.discount_type IS 'Type of discount: percentage or fixed amount';
COMMENT ON COLUMN stripe_coupons.discount_value IS 'Discount value: 0-100 for percentage, cents for amount';