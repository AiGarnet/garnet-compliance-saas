-- Migration 009: Add risk_score column to vendors table
-- Add a risk_score column with random values between 10-85 for existing vendors

-- Step 1: Add the risk_score column to vendors table
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS risk_score INTEGER;

-- Step 2: Add constraint to ensure risk_score is between 10 and 85
ALTER TABLE vendors 
ADD CONSTRAINT check_risk_score_range 
CHECK (risk_score >= 10 AND risk_score <= 85);

-- Step 3: Update existing vendors with random risk scores between 10-85
UPDATE vendors 
SET risk_score = FLOOR(RANDOM() * 76) + 10  -- RANDOM() gives 0-1, multiply by 76 to get 0-75, add 10 to get 10-85
WHERE risk_score IS NULL;

-- Step 4: Add comment for documentation
COMMENT ON COLUMN vendors.risk_score IS 'Risk assessment score for the vendor, ranging from 10 (low risk) to 85 (high risk)';

-- Step 5: Create index for efficient querying by risk score
CREATE INDEX IF NOT EXISTS idx_vendors_risk_score ON vendors(risk_score);

-- Optional: View the updated vendors with their risk scores
-- SELECT vendor_id, company_name, region, status, risk_score FROM vendors ORDER BY risk_score; 