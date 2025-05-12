-- Initialize the database
CREATE DATABASE garnet_ai;

-- Connect to the database
\c garnet_ai;

-- Add necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create compliance_frameworks table
CREATE TABLE compliance_frameworks (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    jurisdiction TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add a comment to describe the table
COMMENT ON TABLE compliance_frameworks IS 'Stores information about various compliance frameworks and standards';

-- Add comments to describe the metadata column
COMMENT ON COLUMN compliance_frameworks.metadata IS 'JSON field containing description, domains (array of strings), and region (string)'; 