-- Create vendor invite tokens table
CREATE TABLE IF NOT EXISTS vendor_invite_tokens (
    token_id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_active_token_per_vendor UNIQUE (vendor_id, token, is_active)
);

-- Create enterprise feedback table
CREATE TABLE IF NOT EXISTS enterprise_feedback (
    feedback_id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    enterprise_name VARCHAR(255) NOT NULL,
    feedback_text TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    is_public BOOLEAN DEFAULT FALSE
);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_vendor_invite_tokens_token ON vendor_invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_vendor_invite_tokens_vendor_id ON vendor_invite_tokens(vendor_id);

-- Create index for faster feedback lookups
CREATE INDEX IF NOT EXISTS idx_enterprise_feedback_vendor_id ON enterprise_feedback(vendor_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for enterprise_feedback
DROP TRIGGER IF EXISTS update_enterprise_feedback_updated_at ON enterprise_feedback;
CREATE TRIGGER update_enterprise_feedback_updated_at
    BEFORE UPDATE ON enterprise_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 