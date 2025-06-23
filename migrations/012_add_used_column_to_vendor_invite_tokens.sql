-- Add used column to vendor_invite_tokens table
ALTER TABLE vendor_invite_tokens 
ADD COLUMN IF NOT EXISTS used BOOLEAN DEFAULT FALSE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_invite_tokens_used ON vendor_invite_tokens(used);

-- Add comment
COMMENT ON COLUMN vendor_invite_tokens.used IS 'Indicates if the invite token has been used'; 