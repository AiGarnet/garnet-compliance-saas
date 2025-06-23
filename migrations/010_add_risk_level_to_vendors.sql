-- Migration 010: Add risk_level column to vendors table
-- Add risk_level based on risk_score values

-- Step 1: Add the risk_level column to vendors table
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS risk_level VARCHAR(10);

-- Step 2: Update risk_level based on risk_score values
-- Low: 10-35, Medium: 36-65, High: 66-85
UPDATE vendors 
SET risk_level = CASE 
    WHEN risk_score BETWEEN 10 AND 35 THEN 'Low'
    WHEN risk_score BETWEEN 36 AND 65 THEN 'Medium'
    WHEN risk_score BETWEEN 66 AND 85 THEN 'High'
    ELSE 'Medium' -- Default fallback
END
WHERE risk_score IS NOT NULL;

-- Step 3: Add constraint to ensure risk_level is valid
ALTER TABLE vendors 
ADD CONSTRAINT check_risk_level_values 
CHECK (risk_level IN ('Low', 'Medium', 'High'));

-- Step 4: Add comment for documentation
COMMENT ON COLUMN vendors.risk_level IS 'Risk level categorization: Low (10-35), Medium (36-65), High (66-85)';

-- Step 5: Create index for efficient querying by risk level
CREATE INDEX IF NOT EXISTS idx_vendors_risk_level ON vendors(risk_level); 