# Evidence File Upload Implementation

## Overview

This document outlines the complete implementation of the evidence file upload functionality for the GarnetAI Compliance SaaS platform. This feature allows vendors to upload supporting documentation and evidence files for compliance purposes.

## Table of Contents

1. [Requirements](#requirements)
2. [Database Schema](#database-schema)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [API Endpoints](#api-endpoints)
6. [File Handling](#file-handling)
7. [Security Considerations](#security-considerations)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

## Requirements

### Functional Requirements

- **File Upload**: Users can upload evidence files for vendors
- **File Types**: Support PDF, DOC, DOCX, JPG, JPEG, PNG, GIF, TXT, XLS, XLSX
- **File Size**: Maximum 10MB per file
- **File Management**: View, download, and delete uploaded files
- **Progress Tracking**: Real-time upload progress indicators
- **Drag & Drop**: Modern drag-and-drop interface
- **File Count**: Display evidence file counts in vendor listings

### Technical Requirements

- **Database**: PostgreSQL with proper foreign key relationships
- **Backend**: Node.js/Express with TypeScript
- **Frontend**: React/Next.js with TypeScript
- **File Storage**: Local file system with UUID naming
- **API**: RESTful endpoints with proper error handling
- **Validation**: File type and size validation

## Database Schema

### Evidence Files Table

```sql
-- Add vendor_id column to existing evidence_files table
ALTER TABLE evidence_files 
ADD COLUMN vendor_id INTEGER REFERENCES vendors(vendor_id);

-- Make answer_id nullable to support vendor-level uploads
ALTER TABLE evidence_files 
ALTER COLUMN answer_id DROP NOT NULL;

-- Add check constraint to ensure either vendor_id or answer_id exists
ALTER TABLE evidence_files 
ADD CONSTRAINT chk_evidence_files_relationship 
CHECK (vendor_id IS NOT NULL OR answer_id IS NOT NULL);

-- Add performance indexes
CREATE INDEX idx_evidence_files_vendor_id ON evidence_files(vendor_id);
CREATE INDEX idx_evidence_files_answer_id ON evidence_files(answer_id);
CREATE INDEX idx_evidence_files_uploaded_at ON evidence_files(uploaded_at);
```

### Table Structure

```sql
evidence_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID REFERENCES answers(id),  -- Nullable
  vendor_id INTEGER REFERENCES vendors(vendor_id),  -- New column
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  metadata JSONB,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

## Backend Implementation

### File Structure

```
backend/
├── src/
│   ├── db/
│   │   └── evidenceRepository.ts     # Database operations
│   ├── services/
│   │   └── evidenceService.ts       # Business logic
│   ├── controllers/
│   │   └── evidenceController.ts    # HTTP handlers
│   ├── routes/
│   │   └── evidenceRoutes.ts        # API routes
│   └── index.ts                     # Route registration
├── uploads/                         # File storage directory
└── package.json                     # Dependencies
```

### Key Components

#### 1. Evidence Repository (`evidenceRepository.ts`)

```typescript
export class EvidenceRepository {
  // Create evidence file record
  async createEvidenceFile(data: CreateEvidenceFileData): Promise<EvidenceFile>
  
  // Get evidence files by vendor
  async getEvidenceFilesByVendor(vendorId: number): Promise<EvidenceFile[]>
  
  // Get evidence files by answer
  async getEvidenceFilesByAnswer(answerId: string): Promise<EvidenceFile[]>
  
  // Get evidence file by ID
  async getEvidenceFileById(id: string): Promise<EvidenceFile | null>
  
  // Delete evidence file
  async deleteEvidenceFile(id: string): Promise<boolean>
  
  // Get evidence count by vendor
  async getEvidenceCountByVendor(vendorId: number): Promise<number>
  
  // Check vendor access
  async checkVendorAccess(fileId: string, vendorId: number): Promise<boolean>
}
```

#### 2. Evidence Service (`evidenceService.ts`)

```typescript
export class EvidenceService {
  // Upload evidence file with validation
  async uploadEvidenceFile(data: UploadEvidenceFileData): Promise<EvidenceFile>
  
  // Get vendor evidence files
  async getVendorEvidenceFiles(vendorId: number): Promise<EvidenceFile[]>
  
  // Get answer evidence files
  async getAnswerEvidenceFiles(answerId: string): Promise<EvidenceFile[]>
  
  // Get evidence file content for download
  async getEvidenceFileContent(fileId: string, vendorId: number): Promise<{file: EvidenceFile, content: Buffer}>
  
  // Delete evidence file
  async deleteEvidenceFile(fileId: string, vendorId: number): Promise<boolean>
  
  // Get evidence count
  async getVendorEvidenceCount(vendorId: number): Promise<number>
}
```

#### 3. Evidence Controller (`evidenceController.ts`)

- **UUID Vendor ID Support**: Automatically resolves UUID vendor IDs to numeric IDs
- **File Upload Handling**: Uses multer for multipart form data
- **Error Handling**: Comprehensive error responses
- **Validation**: File type and size validation

#### 4. Evidence Routes (`evidenceRoutes.ts`)

```typescript
// Evidence file routes for vendors
router.post('/vendors/:vendorId/evidence', upload.single('file'), evidenceController.uploadEvidence);
router.get('/vendors/:vendorId/evidence', evidenceController.getVendorEvidence);
router.get('/vendors/:vendorId/evidence/count', evidenceController.getVendorEvidenceCount);
router.get('/vendors/:vendorId/evidence/:evidenceId/download', evidenceController.downloadEvidence);
router.delete('/vendors/:vendorId/evidence/:evidenceId', evidenceController.deleteEvidence);

// Evidence file routes for answers
router.get('/answers/:answerId/evidence', evidenceController.getAnswerEvidence);
```

### Dependencies Added

```json
{
  "dependencies": {
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/multer": "^1.4.7",
    "@types/uuid": "^9.0.2"
  }
}
```

## Frontend Implementation

### File Structure

```
frontend/
├── components/vendors/
│   ├── EvidenceUpload.tsx           # Main upload component
│   ├── VendorEvidenceSection.tsx    # Evidence section for vendor detail
│   ├── EvidenceCount.tsx            # File count indicator
│   └── VendorDetailView.tsx         # Updated with evidence section
├── hooks/
│   └── useEvidenceCount.ts          # Hook for file counts
├── lib/
│   └── api.ts                       # API functions
└── app/vendors/
    └── page.tsx                     # Updated vendor listing
```

### Key Components

#### 1. EvidenceUpload Component

**Features:**
- Drag-and-drop file upload interface
- Multiple file selection support
- Real-time upload progress indicators
- File type and size validation
- File listing with download/delete actions
- Beautiful UI with file icons and formatting

**Props:**
```typescript
interface EvidenceUploadProps {
  vendorId: string;
  onUploadComplete?: () => void;
  existingFiles?: EvidenceFile[];
  onFilesUpdate?: (files: EvidenceFile[]) => void;
}
```

#### 2. VendorEvidenceSection Component

**Features:**
- Toggleable upload area
- File count and total size display
- Error handling with retry functionality
- Loading states and skeleton UI
- Professional card-based layout

#### 3. Evidence API Functions

```typescript
export const evidence = {
  // Upload evidence file
  upload: (vendorId: string, file: File, metadata?: any) => uploadFile(...),
  
  // Get evidence files by vendor
  getByVendor: (vendorId: string) => apiCall(...),
  
  // Get evidence count
  getCount: (vendorId: string) => apiCall(...),
  
  // Download evidence file
  download: async (vendorId: string, evidenceId: string) => fetch(...),
  
  // Delete evidence file
  delete: (vendorId: string, evidenceId: string) => apiCall(...),
  
  // Get evidence files by answer
  getByAnswer: (answerId: string) => apiCall(...)
};
```

## API Endpoints

### Evidence Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/vendors/:id/evidence` | Upload evidence file |
| GET | `/api/vendors/:id/evidence` | Get vendor evidence files |
| GET | `/api/vendors/:id/evidence/count` | Get evidence file count |
| GET | `/api/vendors/:id/evidence/:fileId/download` | Download evidence file |
| DELETE | `/api/vendors/:id/evidence/:fileId` | Delete evidence file |
| GET | `/api/answers/:id/evidence` | Get answer evidence files |

### Request/Response Examples

#### Upload Evidence File

**Request:**
```http
POST /api/vendors/9321c032-0146-4751-be7b-1683d8b5a1b9/evidence
Content-Type: multipart/form-data

file: [binary file data]
metadata: {"description": "Compliance certificate"}
```

**Response:**
```json
{
  "success": true,
  "message": "Evidence file uploaded successfully",
  "evidenceFile": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "compliance-cert.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "uploadedAt": "2024-01-01T12:00:00Z",
    "metadata": {"description": "Compliance certificate"}
  }
}
```

#### Get Vendor Evidence Files

**Request:**
```http
GET /api/vendors/9321c032-0146-4751-be7b-1683d8b5a1b9/evidence
```

**Response:**
```json
{
  "success": true,
  "evidenceFiles": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "filename": "compliance-cert.pdf",
      "fileSize": 1024000,
      "mimeType": "application/pdf",
      "uploadedAt": "2024-01-01T12:00:00Z",
      "metadata": {"description": "Compliance certificate"},
      "answerId": null
    }
  ],
  "count": 1
}
```

## File Handling

### Supported File Types

- **Documents**: PDF, DOC, DOCX, TXT
- **Images**: JPG, JPEG, PNG, GIF
- **Spreadsheets**: XLS, XLSX

### File Validation

```typescript
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

### File Storage

- **Directory**: `backend/uploads/`
- **Naming**: UUID-based file names to prevent conflicts
- **Organization**: Flat structure with database metadata
- **Security**: Files stored outside web root

### File Operations

1. **Upload**: Validate → Save to disk → Create DB record
2. **Download**: Check access → Read from disk → Stream to client
3. **Delete**: Check access → Remove DB record → Delete from disk

## Security Considerations

### Access Control

- **Vendor-based Access**: Users can only access files for their vendors
- **File Ownership**: Files are tied to specific vendors or answers
- **UUID Resolution**: Automatic mapping of UUID vendor IDs to numeric IDs

### File Validation

- **Type Checking**: MIME type validation on upload
- **Size Limits**: 10MB maximum file size
- **Name Sanitization**: UUID-based file naming prevents path traversal

### Error Handling

- **Proper HTTP Status Codes**: 400, 404, 403, 500
- **Descriptive Error Messages**: Clear error descriptions
- **No Information Leakage**: Secure error responses

## Testing

### Backend Testing

Test files were created during implementation:

- `test-evidence-table.js` - Database structure verification
- `check-vendor-answers.js` - Relationship verification  
- `test-evidence-api.js` - API endpoint testing
- `run-evidence-migration.js` - Database migration testing

### Manual Testing Steps

1. **Upload Test**: Upload various file types and sizes
2. **Download Test**: Download uploaded files and verify content
3. **Delete Test**: Delete files and verify removal
4. **Access Test**: Verify vendor-specific access control
5. **Error Test**: Test invalid files, large files, etc.

### Frontend Testing

- **Drag & Drop**: Test drag-and-drop functionality
- **Progress Indicators**: Verify upload progress display
- **File Listing**: Test file display and actions
- **Error Handling**: Test error states and recovery

## Deployment

### Backend Deployment (Railway)

1. **Environment Setup**: Ensure uploads directory exists
2. **Database Migration**: Run evidence_files table updates
3. **Dependencies**: Install multer and uuid packages
4. **Route Registration**: Verify evidence routes are registered
5. **CORS Configuration**: Ensure Netlify domains are allowed

### Frontend Deployment (Netlify)

1. **API Configuration**: Update API endpoints for Railway backend
2. **Build Process**: Ensure all components compile correctly
3. **Static Assets**: Verify drag-and-drop assets load properly

### Database Migration

```sql
-- Run this migration on production database
ALTER TABLE evidence_files ADD COLUMN vendor_id INTEGER REFERENCES vendors(vendor_id);
ALTER TABLE evidence_files ALTER COLUMN answer_id DROP NOT NULL;
ALTER TABLE evidence_files ADD CONSTRAINT chk_evidence_files_relationship 
CHECK (vendor_id IS NOT NULL OR answer_id IS NOT NULL);
CREATE INDEX idx_evidence_files_vendor_id ON evidence_files(vendor_id);
```

## Troubleshooting

### Common Issues

#### 1. Evidence Routes Not Found (500 Error)

**Problem**: Evidence endpoints returning 500 errors
**Solution**: 
- Verify routes are registered in `index.ts`
- Check evidence routes are mounted under `/api`
- Confirm API documentation shows evidence endpoints

#### 2. UUID Vendor ID Issues

**Problem**: "Invalid vendor ID format" errors
**Solution**:
- Evidence controller now auto-resolves UUID to numeric ID
- Supports both UUID and numeric vendor ID formats
- Proper error handling for vendor not found

#### 3. File Upload Failures

**Problem**: Files not uploading properly
**Causes**:
- Missing uploads directory
- File size exceeding limits
- Invalid file types
- CORS issues

**Solutions**:
- Create `backend/uploads/` directory
- Verify file size < 10MB
- Check file type against allowed list
- Ensure CORS allows Netlify domain

#### 4. Frontend API Calls

**Problem**: Frontend cannot reach evidence endpoints
**Solution**:
- Verify API configuration in `lib/api.ts`
- Check Railway backend URL is correct
- Confirm evidence API functions are imported

### Debugging Tips

1. **Check API Documentation**: Visit Railway backend root URL to see all endpoints
2. **Monitor Network Tab**: Check browser network tab for API calls
3. **Check Server Logs**: Railway deployment logs show API requests
4. **Verify Database**: Check evidence_files table has vendor_id column
5. **Test File Permissions**: Ensure uploads directory is writable

## Future Enhancements

### Potential Improvements

1. **Cloud Storage**: Move from local files to AWS S3/Google Cloud
2. **File Compression**: Automatic image compression for large files
3. **Virus Scanning**: Integrate antivirus scanning for uploads
4. **File Versioning**: Support multiple versions of the same document
5. **Bulk Upload**: Support uploading multiple files at once
6. **File Categories**: Organize files by category/type
7. **Search/Filter**: Search through uploaded files
8. **File Preview**: In-browser preview for images and PDFs

### API Enhancements

1. **Pagination**: Paginate file listings for large datasets
2. **Sorting**: Sort files by date, size, name, etc.
3. **Bulk Operations**: Bulk delete/download operations
4. **File Metadata**: Enhanced metadata support
5. **Audit Trail**: Track file access and modifications

## Conclusion

The evidence file upload functionality has been successfully implemented with:

- ✅ Complete backend API with proper validation and security
- ✅ Modern frontend interface with drag-and-drop support
- ✅ Database schema supporting both vendor and answer relationships
- ✅ UUID vendor ID support for seamless integration
- ✅ Comprehensive error handling and user feedback
- ✅ File management capabilities (upload, download, delete)
- ✅ Real-time file counts and progress indicators

The implementation provides a solid foundation for evidence file management in the compliance workflow and can be easily extended with additional features as needed.

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Implementation Status**: Complete and Deployed 