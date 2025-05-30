-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  risk_score INTEGER NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  contact_name TEXT,
  contact_email TEXT,
  website TEXT,
  industry TEXT,
  description TEXT
);

-- Create vendor_questionnaire_answers table
CREATE TABLE IF NOT EXISTS vendor_questionnaire_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vendor_id, question_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_risk_level ON vendors(risk_level);
CREATE INDEX IF NOT EXISTS idx_vendor_questionnaire_answers_vendor_id ON vendor_questionnaire_answers(vendor_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_vendor_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at
BEFORE UPDATE ON vendors
FOR EACH ROW
EXECUTE FUNCTION update_vendor_updated_at_column();

DROP TRIGGER IF EXISTS update_vendor_questionnaire_answers_updated_at ON vendor_questionnaire_answers;
CREATE TRIGGER update_vendor_questionnaire_answers_updated_at
BEFORE UPDATE ON vendor_questionnaire_answers
FOR EACH ROW
EXECUTE FUNCTION update_vendor_updated_at_column(); 