# DigitalOcean Spaces Integration

## Overview

This document describes the integration of DigitalOcean Spaces (S3-compatible object storage) into the Garnet AI compliance platform for storing checklist files and supporting documents.

## Features Implemented

### 🗂️ **Checklist Storage**
- **Automatic Upload**: When users upload checklist files, they are processed and stored as JSON in the `checklists/` folder
- **Structured Data**: Each checklist is stored with metadata including vendor ID, original filename, extraction date, and question data
- **Database Integration**: Checklist records include `spaces_key` and `spaces_url` fields for direct access

### 📎 **Supporting Documents Storage**
- **File Upload**: Supporting documents (PDFs, images, etc.) are uploaded to the `supporting-docs/` folder
- **Unique Naming**: Files are renamed with vendor ID, question ID, and UUID to prevent conflicts
- **Metadata Preservation**: Original filename, file type, and size are preserved in the database

### 🔐 **Security & Privacy**
- **Private Access**: All files are uploaded with private ACL
- **Vendor Isolation**: Files are organized by vendor ID to ensure data privacy
- **Signed URLs**: Temporary access URLs can be generated for secure file access

## Environment Configuration

### Required Environment Variables

```bash
# DigitalOcean Spaces Configuration
DO_SPACE_ACCESS_KEY=DO801YLDFBDP944G49GV
DO_SPACE_SECRET_KEY=b69qfec7hR3d6Do/BmwzbPnomrOAW1FJ+0T+aomJuE4
DO_SPACE_REGION=ams3
DO_SPACE_NAME=vendor-onboarding
DO_SPACE_ENDPOINT=https://vendor-onboarding.ams3.digitaloceanspaces.com
DO_SPACE_CDN_ENDPOINT=https://vendor-onboarding.ams3.cdn.digitaloceanspaces.com
```

### Folder Structure

```
vendor-onboarding/
├── checklists/
│   ├── vendor1_checklist1_timestamp.json
│   ├── vendor2_checklist2_timestamp.json
│   └── ...
└── supporting-docs/
    ├── vendor1_question1_uuid.pdf
    ├── vendor1_question2_uuid.png
    └── ...
```

## API Endpoints

### Checklist Upload
```http
POST /api/checklists/upload
Content-Type: multipart/form-data

Body:
- file: [checklist file]
- vendorId: [UUID]
- name: [optional name]
```

**Response:**
```json
{
  "checklist": {
    "id": "uuid",
    "vendorId": "uuid",
    "name": "checklist.pdf",
    "extractionStatus": "completed",
    "questionCount": 25,
    "spacesKey": "checklists/vendor_checklist_timestamp.json",
    "spacesUrl": "https://vendor-onboarding.ams3.digitaloceanspaces.com/checklists/..."
  },
  "questions": [...]
}
```

### Supporting Document Upload
```http
POST /api/checklists/questions/{questionId}/documents/vendor/{vendorId}
Content-Type: multipart/form-data

Body:
- file: [supporting document]
```

**Response:**
```json
{
  "id": "uuid",
  "questionId": "uuid",
  "vendorId": "uuid",
  "filename": "evidence.pdf",
  "spacesKey": "supporting-docs/vendor_question_uuid.pdf",
  "spacesUrl": "https://vendor-onboarding.ams3.digitaloceanspaces.com/supporting-docs/..."
}
```

## Database Schema Updates

### Migration 015: Added Spaces Fields

```sql
-- Checklists table
ALTER TABLE checklists 
ADD COLUMN spaces_key TEXT,
ADD COLUMN spaces_url TEXT;

-- Supporting documents table
ALTER TABLE checklist_supporting_documents 
ADD COLUMN spaces_key TEXT,
ADD COLUMN spaces_url TEXT;
```

## Service Architecture

### DigitalOceanSpacesService
Located: `src/common/services/digitalocean-spaces.service.ts`

**Key Methods:**
- `uploadChecklist()`: Upload checklist JSON data
- `uploadSupportingDocument()`: Upload supporting document files
- `deleteFile()`: Remove files from Spaces
- `getFile()`: Retrieve file contents
- `generateSignedUrl()`: Create temporary access URLs

### Integration Points

1. **ChecklistsService**: Uses Spaces service for file operations
2. **ChecklistsController**: Handles multipart file uploads
3. **ChecklistsModule**: Provides DigitalOceanSpacesService

## Workflow Integration

### Questionnaire Page Flow

1. **Upload**: User uploads checklist file via frontend
2. **Processing**: Backend extracts questions and creates database records
3. **Storage**: Checklist data is uploaded to `checklists/` folder as JSON
4. **Database Update**: Checklist record is updated with Spaces URLs
5. **Response**: Frontend receives processed data with storage references

### Supporting Documents Flow

1. **Upload**: User uploads supporting document for a question
2. **Validation**: System verifies question belongs to vendor
3. **Storage**: File is uploaded to `supporting-docs/` folder
4. **Database Record**: Supporting document record is created with Spaces URLs
5. **Response**: Frontend receives file metadata and access URLs

## Error Handling

### Upload Failures
- **Network Issues**: Retry mechanism with exponential backoff
- **Authentication**: Clear error messages for credential issues
- **File Size**: Validation against configured limits
- **File Type**: MIME type validation for security

### Database Consistency
- **Rollback**: If Spaces upload fails, database records are cleaned up
- **Orphaned Files**: Regular cleanup jobs for unreferenced files
- **Sync Issues**: Monitoring for database/Spaces inconsistencies

## Performance Optimizations

### Upload Optimization
- **Multipart Upload**: Large files use multipart upload for reliability
- **CDN Integration**: Files served via CDN for faster access
- **Compression**: JSON files are minified before upload
- **Parallel Processing**: Multiple files can be uploaded concurrently

### Caching Strategy
- **Metadata Caching**: File metadata cached in database
- **CDN Caching**: Static files cached at edge locations
- **Signed URL Caching**: Temporary URLs cached for repeated access

## Monitoring & Logging

### Metrics Tracked
- Upload success/failure rates
- File size distributions
- Storage usage by vendor
- Access patterns and frequency

### Log Events
- File upload/download operations
- Authentication failures
- Storage quota warnings
- Performance metrics

## Security Considerations

### Access Control
- **Private Files**: All uploads use private ACL
- **Vendor Isolation**: Files organized by vendor ID
- **Signed URLs**: Temporary access for authorized users only
- **CORS Policy**: Restricted cross-origin access

### Data Protection
- **Encryption**: Files encrypted at rest and in transit
- **Backup**: Regular backups to secondary storage
- **Audit Trail**: All file operations logged
- **Compliance**: GDPR/SOC2 compliance maintained

## Deployment Notes

### Environment Setup
1. Set all required environment variables in Railway/deployment platform
2. Run migration 015 to add Spaces fields to database
3. Configure DigitalOcean Spaces bucket with proper permissions
4. Test upload/download functionality in staging environment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] Spaces bucket created and configured
- [ ] CDN endpoint configured
- [ ] Monitoring alerts set up
- [ ] Backup strategy implemented
- [ ] Security policies applied

## Troubleshooting

### Common Issues

**Upload Failures:**
```bash
# Check credentials
curl -X GET https://vendor-onboarding.ams3.digitaloceanspaces.com/

# Verify environment variables
echo $DO_SPACE_ACCESS_KEY
```

**Database Sync Issues:**
```sql
-- Check for records without Spaces URLs
SELECT id, name FROM checklists WHERE spaces_key IS NULL;
```

**Performance Issues:**
- Monitor upload times and file sizes
- Check CDN cache hit rates
- Verify network connectivity to Spaces endpoint

## Future Enhancements

### Planned Features
- **File Versioning**: Track multiple versions of uploaded files
- **Bulk Operations**: Batch upload/download capabilities
- **Advanced Analytics**: Detailed usage and performance metrics
- **Automated Cleanup**: Scheduled removal of orphaned files
- **Content Scanning**: Virus/malware detection for uploads

### Optimization Opportunities
- **Compression**: Automatic compression for large files
- **Deduplication**: Detect and handle duplicate uploads
- **Smart Caching**: Intelligent cache invalidation strategies
- **Load Balancing**: Multiple Spaces regions for global performance

---

## Contact & Support

For issues related to DigitalOcean Spaces integration:
1. Check logs in Railway dashboard
2. Verify environment variables are set correctly
3. Test connectivity to Spaces endpoint
4. Review database migration status

**Last Updated:** December 2024
**Version:** 1.0 