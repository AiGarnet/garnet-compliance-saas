# Garnet AI Database Schema Documentation

This document provides a comprehensive overview of the database schema used in the Garnet AI Compliance SaaS platform. It outlines the tables, their relationships, and the improvements made to ensure data integrity and performance.

## Entity Relationship Diagram

The following diagram illustrates the relationships between the main entities in the database:

```mermaid
erDiagram
    VENDORS {
        uuid UUID PK
        int vendor_id UK
        string company_name
        string region
        string status
        string contact_name
        string contact_email
        string website
        string industry
        string description
        float risk_score
        string risk_level
        timestamp created_at
        timestamp updated_at
    }
    
    VENDOR_QUESTIONNAIRE_ANSWERS {
        uuid id PK
        int vendor_id FK
        string question_id
        string question
        string answer
        string status
        boolean share_to_trust_portal
        string work_id
        timestamp created_at
        timestamp updated_at
    }
    
    VENDOR_WORKS {
        uuid id PK
        int vendor_id FK
        string project_name
        string description
        string status
        date start_date
        date end_date
        string client_name
        json technologies
        string category
        boolean share_to_trust_portal
        boolean is_draft
        timestamp last_saved_at
        timestamp created_at
        timestamp updated_at
    }
    
    CHECKLISTS {
        uuid id PK
        uuid vendor_id FK
        string name
        string file_type
        int file_size
        string original_filename
        text file_content
        string extraction_status
        int question_count
        timestamp upload_date
        uuid uploaded_by FK
        string spaces_key
        string spaces_url
        timestamp created_at
        timestamp updated_at
    }
    
    CHECKLIST_QUESTIONS {
        uuid id PK
        uuid checklist_id FK
        uuid vendor_id FK
        text question_text
        int question_order
        string status
        text ai_answer
        decimal confidence_score
        boolean requires_document
        text document_description
        timestamp created_at
        timestamp updated_at
    }
    
    CHECKLIST_SUPPORTING_DOCUMENTS {
        uuid id PK
        uuid question_id FK
        uuid vendor_id FK
        string filename
        string file_type
        int file_size
        text file_path
        string spaces_key
        string spaces_url
        timestamp uploaded_at
        uuid uploaded_by FK
        timestamp created_at
        timestamp updated_at
    }
    
    TRUST_PORTAL_ITEMS {
        int id PK
        int vendor_id FK
        string title
        string description
        string category
        string file_url
        string file_type
        string file_size
        text content
        boolean is_questionnaire_answer
        string questionnaire_id
        timestamp created_at
        timestamp updated_at
    }
    
    TRUST_PORTAL_SHARED_DOCUMENTS {
        int id PK
        int vendor_id FK
        string document_title
        string document_description
        string document_category
        string file_url
        string file_name
        string file_type
        int file_size
        boolean is_evidence_file
        boolean is_questionnaire_answer
        string questionnaire_id
        string work_id FK
        boolean share_to_trust_portal
        boolean is_active
        int display_order
        timestamp created_at
        timestamp updated_at
    }
    
    TRUST_PORTAL_FEEDBACK {
        int id PK
        int vendor_id FK
        string enterprise_contact_name
        string enterprise_contact_email
        string enterprise_company_name
        string feedback_type
        string subject
        text message
        string status
        string priority
        string invite_token
        timestamp created_at
        timestamp updated_at
    }
    
    TRUST_PORTAL_FEEDBACK_RESPONSES {
        int id PK
        int feedback_id FK
        string responder_type
        string responder_name
        string responder_email
        text message
        json attachments
        boolean is_internal_note
        timestamp created_at
        timestamp updated_at
    }
    
    TRUST_PORTAL_SUBMISSIONS {
        uuid id PK
        int vendor_id FK
        uuid vendor_uuid FK
        string questionnaire_id
        string status
        string enterprise_email
        text message
        jsonb checklist_ids
        timestamp submitted_at
        timestamp reviewed_at
        timestamp approved_at
        string reviewer_email
        text reviewer_comments
        string follow_on_questionnaire_id
        timestamp created_at
        timestamp updated_at
    }
    
    EVIDENCE_FILES {
        uuid id PK
        int vendor_id FK
        string answer_id
        string work_id
        string filename
        string original_filename
        string mime_type
        int file_size
        string file_path
        string uploaded_by FK
        timestamp uploaded_at
        boolean share_to_trust_portal
        jsonb metadata
        string spaces_key
        string spaces_url
        timestamp created_at
        timestamp updated_at
    }
    
    ACTIVITIES {
        uuid id PK
        string type
        string status
        string description
        string user_id
        string user_name
        string user_email
        string entity_id
        string entity_type
        string entity_name
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
    
    USERS {
        uuid id PK
        string email UK
        string password_hash
        string full_name
        string role
        string organization
        jsonb metadata
        boolean is_active
        string source
        timestamp signup_date
        timestamp created_at
        timestamp updated_at
    }
    
    WAITLIST {
        uuid id PK
        string name
        string email UK
        string role
        string organization
        timestamp created_at
        timestamp updated_at
    }
    
    VENDORS ||--o{ VENDOR_QUESTIONNAIRE_ANSWERS : "has"
    VENDORS ||--o{ CHECKLISTS : "has"
    VENDORS ||--o{ VENDOR_WORKS : "has"
    VENDORS ||--o{ TRUST_PORTAL_ITEMS : "has"
    VENDORS ||--o{ TRUST_PORTAL_SHARED_DOCUMENTS : "has"
    VENDORS ||--o{ TRUST_PORTAL_FEEDBACK : "receives"
    VENDORS ||--o{ TRUST_PORTAL_SUBMISSIONS : "submits"
    VENDORS ||--o{ EVIDENCE_FILES : "uploads"
    
    CHECKLISTS ||--o{ CHECKLIST_QUESTIONS : "contains"
    CHECKLIST_QUESTIONS ||--o{ CHECKLIST_SUPPORTING_DOCUMENTS : "has"
    
    TRUST_PORTAL_FEEDBACK ||--o{ TRUST_PORTAL_FEEDBACK_RESPONSES : "has"
    
    VENDOR_WORKS ||--o{ TRUST_PORTAL_SHARED_DOCUMENTS : "contains"
    
    USERS ||--o{ ACTIVITIES : "generates"
    USERS ||--o{ CHECKLISTS : "uploads"
    USERS ||--o{ CHECKLIST_SUPPORTING_DOCUMENTS : "uploads"
    USERS ||--o{ EVIDENCE_FILES : "uploads"
```

## Tables Overview

### Vendors
The central entity that represents partner companies in the system.

- **Primary Key**: `uuid` (UUID), `vendor_id` (Integer, legacy ID)
- **Key Fields**: `company_name`, `contact_email`, `status`
- **Relationships**:
  - One-to-many with Vendor Questionnaire Answers
  - One-to-many with Checklists
  - One-to-many with Vendor Works
  - One-to-many with Trust Portal Items
  - One-to-many with Trust Portal Submissions

### Vendor Questionnaire Answers
Stores answers to questionnaire questions.

- **Primary Key**: `id` (UUID)
- **Foreign Key**: `vendor_id` references `vendors.vendor_id`
- **Key Fields**: `question`, `answer`, `status`
- **Relationships**:
  - Many-to-one with Vendors

### Vendor Works
Vendor project/work submissions.

- **Primary Key**: `id` (UUID)
- **Foreign Key**: `vendor_id` references `vendors.vendor_id`
- **Key Fields**: `project_name`, `status`, `share_to_trust_portal`
- **Relationships**:
  - Many-to-one with Vendors
  - One-to-many with Trust Portal Shared Documents

### Checklists
Uploaded compliance checklists with vendor-based data privacy.

- **Primary Key**: `id` (UUID)
- **Foreign Key**: `vendor_id` references `vendors.uuid`
- **Key Fields**: `name`, `file_type`, `extraction_status`
- **Relationships**:
  - Many-to-one with Vendors
  - One-to-many with Checklist Questions
  - Many-to-one with Users (uploaded_by)

### Checklist Questions
Questions extracted from checklists with AI-generated answers.

- **Primary Key**: `id` (UUID)
- **Foreign Keys**: 
  - `checklist_id` references `checklists.id`
  - `vendor_id` references `vendors.uuid`
- **Key Fields**: `question_text`, `question_order`, `status`
- **Relationships**:
  - Many-to-one with Checklists
  - One-to-many with Checklist Supporting Documents

### Checklist Supporting Documents
Supporting documents for checklist questions.

- **Primary Key**: `id` (UUID)
- **Foreign Keys**: 
  - `question_id` references `checklist_questions.id`
  - `vendor_id` references `vendors.uuid`
  - `uploaded_by` references `users.id`
- **Key Fields**: `filename`, `file_type`, `spaces_key`
- **Relationships**:
  - Many-to-one with Checklist Questions
  - Many-to-one with Users (uploaded_by)

### Trust Portal Items
Items displayed in the trust portal.

- **Primary Key**: `id` (Integer)
- **Foreign Key**: `vendor_id` references `vendors.vendor_id`
- **Key Fields**: `title`, `category`, `is_questionnaire_answer`
- **Relationships**:
  - Many-to-one with Vendors

### Trust Portal Shared Documents
Documents shared via the trust portal.

- **Primary Key**: `id` (Integer)
- **Foreign Keys**: 
  - `vendor_id` references `vendors.vendor_id`
  - `work_id` references `vendor_works.id`
- **Key Fields**: `document_title`, `document_category`, `share_to_trust_portal`
- **Relationships**:
  - Many-to-one with Vendors
  - Many-to-one with Vendor Works

### Trust Portal Feedback
Feedback from enterprises to vendors.

- **Primary Key**: `id` (Integer)
- **Foreign Key**: `vendor_id` references `vendors.vendor_id`
- **Key Fields**: `enterprise_contact_email`, `feedback_type`, `status`
- **Relationships**:
  - Many-to-one with Vendors
  - One-to-many with Trust Portal Feedback Responses

### Trust Portal Feedback Responses
Responses to trust portal feedback.

- **Primary Key**: `id` (Integer)
- **Foreign Key**: `feedback_id` references `trust_portal_feedback.id`
- **Key Fields**: `responder_type`, `message`, `is_internal_note`
- **Relationships**:
  - Many-to-one with Trust Portal Feedback

### Trust Portal Submissions
Tracks questionnaire submissions from vendors to enterprises.

- **Primary Key**: `id` (UUID)
- **Foreign Keys**: 
  - `vendor_id` references `vendors.vendor_id`
  - `vendor_uuid` references `vendors.uuid`
- **Key Fields**: `status`, `enterprise_email`, `submitted_at`
- **Relationships**:
  - Many-to-one with Vendors

### Evidence Files
Evidence files uploaded by vendors.

- **Primary Key**: `id` (UUID)
- **Foreign Keys**: 
  - `vendor_id` references `vendors.vendor_id`
  - `uploaded_by` references `users.id`
- **Key Fields**: `filename`, `file_path`, `share_to_trust_portal`
- **Relationships**:
  - Many-to-one with Vendors
  - Many-to-one with Users (uploaded_by)

### Activities
Audit log of all system activities.

- **Primary Key**: `id` (UUID)
- **Key Fields**: `type`, `status`, `description`, `user_id`
- **Indexes**: `(userId, createdAt)`, `(type, createdAt)`, `(status, createdAt)`
- **Relationships**:
  - Many-to-one with Users

### Users
System users with role-based access control.

- **Primary Key**: `id` (UUID)
- **Unique Key**: `email`
- **Key Fields**: `full_name`, `role`, `is_active`
- **Relationships**:
  - One-to-many with Activities
  - One-to-many with Checklists (as uploader)
  - One-to-many with Evidence Files (as uploader)

### Waitlist
Stores waitlist entries for users interested in the platform.

- **Primary Key**: `id` (UUID)
- **Unique Key**: `email`
- **Key Fields**: `name`, `email`, `role`, `organization`

## Schema Improvements

The following improvements have been made to the database schema:

1. **Consistent Primary Key Types**: Added UUID column to vendors table to standardize primary key types.

2. **Foreign Key Constraints**: Added missing foreign key constraints to ensure referential integrity.

3. **Cascading Deletes**: Added ON DELETE CASCADE constraints to ensure child records are properly deleted when parent records are removed.

4. **Indexes for Performance**: Added strategic indexes to improve query performance, especially for frequently joined columns.

5. **NOT NULL Constraints**: Added NOT NULL constraints to critical columns to prevent data integrity issues.

6. **Check Constraints**: Added check constraints for enum values to ensure data consistency.

7. **Documentation**: Added table and column comments to document the purpose and relationships.

8. **Consistent Timestamps**: Ensured all tables have created_at and updated_at columns for audit purposes.

9. **New Trust Portal Submissions Table**: Created a new table to track questionnaire submissions from vendors to enterprises.

## Data Privacy and Security

The schema includes several security features:

1. **Row-Level Security**: Tables like checklists, checklist_questions, and checklist_supporting_documents have row-level security policies to ensure vendors can only access their own data.

2. **Data Isolation**: Foreign keys to vendor_id ensure proper data isolation between different vendors.

3. **Audit Logging**: The activities table provides comprehensive audit logging for all system actions.

## Performance Considerations

1. **Indexed Foreign Keys**: All foreign keys are indexed to improve join performance.

2. **Composite Indexes**: Strategic composite indexes are used for common query patterns.

3. **JSON/JSONB Fields**: Used for flexible metadata storage while maintaining structure for core fields.

## Migration Path

The schema improvements have been implemented through migration 018, which ensures backward compatibility while enhancing data integrity and performance.

## How to Run the Migration

To apply these database schema improvements, follow these steps:

1. Ensure you have the correct database connection string:
   ```bash
   # Option 1: Set as environment variable
   export DATABASE_URL=postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway
   
   # Option 2: The scripts have this connection string hardcoded as a fallback
   ```

2. Run the migration script:
   ```bash
   node migrations/run_migration_018.js
   ```

3. Validate the database schema after migration:
   ```bash
   node migrations/validate_schema.js
   ```

4. Verify the migration was successful by checking the database schema:
   ```sql
   -- Check if foreign keys were added
   SELECT conname, conrelid::regclass, confrelid::regclass
   FROM pg_constraint
   WHERE contype = 'f' AND conname LIKE 'fk_%';
   
   -- Check if indexes were created
   SELECT indexname, tablename
   FROM pg_indexes
   WHERE indexname LIKE 'idx_%';
   ```

## Backup Recommendation

Before running this migration in production, ensure you have a complete database backup:

```bash
pg_dump -U your_db_user -h your_db_host -d your_db_name > backup_before_migration_018.sql
```

## Rollback Plan

If you need to roll back the migration, you can use the following SQL:

```sql
-- Drop added constraints
ALTER TABLE trust_portal_submissions DROP CONSTRAINT IF EXISTS fk_trust_portal_submissions_vendor_uuid;
ALTER TABLE questionnaires DROP CONSTRAINT IF EXISTS fk_questionnaires_vendor;
ALTER TABLE questionnaire_questions DROP CONSTRAINT IF EXISTS fk_questionnaire_questions_questionnaire;
ALTER TABLE vendor_works DROP CONSTRAINT IF EXISTS fk_vendor_works_vendor;

-- Drop added indexes
DROP INDEX IF EXISTS idx_questionnaires_vendor_id;
DROP INDEX IF EXISTS idx_questionnaire_questions_questionnaire_id;
DROP INDEX IF EXISTS idx_vendor_works_vendor_id;

-- Drop added columns
ALTER TABLE trust_portal_submissions DROP COLUMN IF EXISTS vendor_uuid;

-- Remove check constraints
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS check_vendor_status;
ALTER TABLE questionnaires DROP CONSTRAINT IF EXISTS check_questionnaire_status;
``` 