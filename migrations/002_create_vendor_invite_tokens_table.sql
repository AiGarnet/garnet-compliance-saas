-- Create vendor_invite_tokens table for trust portal invite links
CREATE TABLE IF NOT EXISTS vendor_invite_tokens (
    id SERIAL PRIMARY KEY,
    token UUID UNIQUE NOT NULL,
    vendor_id INTEGER NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_vendor_invite_tokens_vendor_id 
        FOREIGN KEY (vendor_id) 
        REFERENCES vendors(vendor_id) 
        ON DELETE CASCADE,
    
    CONSTRAINT uq_vendor_invite_tokens_vendor_id 
        UNIQUE (vendor_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_invite_tokens_token ON vendor_invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_vendor_invite_tokens_vendor_id ON vendor_invite_tokens(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_invite_tokens_expires_at ON vendor_invite_tokens(expires_at);

-- Add comment to table
COMMENT ON TABLE vendor_invite_tokens IS 'Stores invite tokens for trust portal access'; 