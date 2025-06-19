-- Migration 008: Create Activities Table for Activity Tracking
-- This table will store all user activities and system events with toast notification data

-- Create enum types for activity type and status
CREATE TYPE activity_type AS ENUM (
  'client_created', 'client_updated', 'client_deleted', 'client_status_changed',
  'questionnaire_created', 'questionnaire_updated', 'questionnaire_submitted', 
  'questionnaire_reviewed', 'questionnaire_approved', 'questionnaire_rejected', 'questionnaire_deleted',
  'evidence_uploaded', 'evidence_approved', 'evidence_rejected', 'evidence_deleted', 'document_uploaded',
  'compliance_assessment_started', 'compliance_assessment_completed', 'compliance_score_updated', 
  'framework_added', 'framework_removed',
  'user_login', 'user_logout', 'user_profile_updated', 'user_created', 'user_deleted',
  'trust_portal_viewed', 'trust_portal_shared', 'trust_portal_updated',
  'report_generated', 'data_exported', 'data_imported', 'integration_connected', 'integration_disconnected',
  'waitlist_signup', 'waitlist_approved', 'waitlist_rejected'
);

CREATE TYPE activity_status AS ENUM ('success', 'pending', 'failed', 'in_progress');

-- Create the activities table
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type activity_type NOT NULL,
  status activity_status DEFAULT 'success' NOT NULL,
  description VARCHAR(500) NOT NULL,
  
  -- User information
  user_id VARCHAR(255),
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  
  -- Entity references
  entity_id VARCHAR(255), -- ID of the related entity (vendor, questionnaire, etc.)
  entity_type VARCHAR(100), -- Type of entity (vendor, questionnaire, evidence, etc.)
  entity_name VARCHAR(255), -- Name/title of the entity for display
  
  -- Metadata stored as JSONB for flexibility and performance
  metadata JSONB,
  
  -- Toast notification configuration
  toast_config JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX idx_activities_user_id_created_at ON activities(user_id, created_at DESC);
CREATE INDEX idx_activities_type_created_at ON activities(type, created_at DESC);
CREATE INDEX idx_activities_status_created_at ON activities(status, created_at DESC);
CREATE INDEX idx_activities_entity_type ON activities(entity_type);
CREATE INDEX idx_activities_entity_id ON activities(entity_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

-- Create partial indexes for common queries
CREATE INDEX idx_activities_recent_success ON activities(created_at DESC) 
  WHERE status = 'success';
CREATE INDEX idx_activities_recent_failures ON activities(created_at DESC) 
  WHERE status = 'failed';
CREATE INDEX idx_activities_user_recent ON activities(user_id, created_at DESC) 
  WHERE user_id IS NOT NULL;

-- Create GIN index for JSONB metadata queries
CREATE INDEX idx_activities_metadata_gin ON activities USING GIN(metadata);
CREATE INDEX idx_activities_toast_config_gin ON activities USING GIN(toast_config);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_activities_updated_at();

-- Add comments for documentation
COMMENT ON TABLE activities IS 'Stores all user activities and system events with toast notification data';
COMMENT ON COLUMN activities.type IS 'Type of activity performed';
COMMENT ON COLUMN activities.status IS 'Status of the activity (success, pending, failed, in_progress)';
COMMENT ON COLUMN activities.description IS 'Human-readable description of the activity';
COMMENT ON COLUMN activities.user_id IS 'ID of the user who performed the activity';
COMMENT ON COLUMN activities.user_name IS 'Name of the user for display purposes';
COMMENT ON COLUMN activities.user_email IS 'Email of the user for display purposes';
COMMENT ON COLUMN activities.entity_id IS 'ID of the related entity (vendor, questionnaire, etc.)';
COMMENT ON COLUMN activities.entity_type IS 'Type of the related entity';
COMMENT ON COLUMN activities.entity_name IS 'Display name of the related entity';
COMMENT ON COLUMN activities.metadata IS 'Additional activity metadata as JSON';
COMMENT ON COLUMN activities.toast_config IS 'Toast notification configuration as JSON';

-- Insert some sample activities for testing (optional)
INSERT INTO activities (type, status, description, user_id, user_name, user_email, entity_type, entity_name, metadata, toast_config) VALUES
(
  'client_created', 
  'success', 
  'Admin created client "TechCorp Solutions"',
  'admin-1',
  'Admin User',
  'admin@garnet.ai',
  'client',
  'TechCorp Solutions',
  '{"clientId": "client-1", "clientName": "TechCorp Solutions", "status": "active"}',
  '{"title": "Client Created", "message": "Client \"TechCorp Solutions\" has been created successfully", "type": "success", "duration": 5000}'
),
(
  'questionnaire_submitted',
  'success',
  'Client submitted SOC2 questionnaire',
  'client-1',
  'John Doe',
  'john@techcorp.com',
  'questionnaire',
  'SOC2 Type II Assessment',
  '{"questionnaireId": "q-1", "questionnaireName": "SOC2 Type II Assessment", "frameworkType": "SOC2"}',
  '{"title": "Questionnaire Submitted", "message": "Questionnaire has been submitted for review", "type": "info", "duration": 5000, "showProgress": true}'
),
(
  'evidence_uploaded',
  'success',
  'Client uploaded evidence "Security Policy Document.pdf"',
  'client-1',
  'John Doe',
  'john@techcorp.com',
  'evidence',
  'Security Policy Document.pdf',
  '{"fileName": "Security Policy Document.pdf", "fileSize": 2048576, "evidenceType": "policy", "frameworkType": "SOC2"}',
  '{"title": "Evidence Uploaded", "message": "Evidence \"Security Policy Document.pdf\" uploaded successfully", "type": "success", "duration": 4000}'
);

-- Grant permissions (skip for Railway - using postgres superuser)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON activities TO authenticated_user;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated_user; 