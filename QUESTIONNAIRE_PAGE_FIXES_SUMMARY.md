# Questionnaire Page Fixes Summary

## Issues Fixed

### 1. Vendor Dropdown Not Showing All Vendors

**Problem**: The vendor dropdown in the questionnaire page wasn't displaying all vendors properly.

**Root Cause**: The vendor API response structure wasn't being handled properly - the questionnaire page was expecting a simple array but the API returns different response structures.

**Solution**: Updated `loadVendors()` function in `garnet-compliance-saas-frontend/frontend/app/questionnaires/page.tsx` to handle multiple API response structures:

```typescript
const loadVendors = async () => {
  setIsLoadingVendors(true);
  try {
    console.log('Loading vendors from API...');
    const response = await vendorAPI.getAll();
    console.log('Vendor API response:', response);
    
    // Handle the API response structure properly (like in vendors page)
    if (response && response.data && Array.isArray(response.data)) {
      // Handle response with .data structure
      const transformedVendors = response.data.map((vendor: any) => ({
        id: vendor.uuid || vendor.id || vendor.vendorId?.toString(),
        name: vendor.companyName || vendor.name || 'Unknown Vendor',
        status: vendor.status || 'Active'
      }));
      setVendors(transformedVendors);
    } else if (response && response.vendors && Array.isArray(response.vendors)) {
      // Handle response with .vendors structure
      // ... similar transformation
    } else if (response && Array.isArray(response)) {
      // Handle case where response is directly an array
      // ... direct array transformation
    } else {
      console.log('No vendors found or unexpected response structure');
      setVendors([]);
    }
  } catch (error) {
    console.error('Error loading vendors:', error);
    setVendors([]);
  } finally {
    setIsLoadingVendors(false);
  }
};
```

### 2. Supporting Documents Uploading to Wrong Endpoint

**Problem**: Supporting document uploads were interfering with checklist uploads, both using same upload states and potentially conflicting.

**Root Cause**: Both upload types were sharing the same upload states (`isUploading`, `uploadError`) and drag/drop handlers weren't section-specific.

**Solution**: Complete separation of upload functionality:

#### A. Separate Upload States
```typescript
// Checklist upload states
const [isUploading, setIsUploading] = useState(false);
const [uploadError, setUploadError] = useState<string | null>(null);

// Supporting document upload states (NEW)
const [isUploadingSupportDoc, setIsUploadingSupportDoc] = useState(false);
const [supportDocUploadError, setSupportDocUploadError] = useState<string | null>(null);
const [uploadingQuestionId, setUploadingQuestionId] = useState<string | null>(null);
```

#### B. Section-Specific Drag & Drop
```typescript
// Drag and drop handlers for CHECKLIST UPLOAD ONLY
const handleDrag = (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  
  // Only activate drag for upload section
  if (activeSection === 'upload') {
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }
};

const handleDrop = async (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setDragActive(false);
  
  // Only handle drop for checklist upload in upload section
  if (activeSection === 'upload' && e.dataTransfer.files && e.dataTransfer.files[0]) {
    await handleFileUpload(e.dataTransfer.files);
  }
};
```

#### C. Enhanced Supporting Document Upload Function
```typescript
// Support document functions - COMPLETELY SEPARATE FROM CHECKLIST UPLOAD
const handleSupportDocUpload = async (questionId: string, files: FileList) => {
  console.log(`🔹 SUPPORTING DOCUMENT UPLOAD: Starting upload for question ${questionId}, file: ${file.name}`);
  
  setIsUploadingSupportDoc(true);
  setUploadingQuestionId(questionId);
  setSupportDocUploadError(null);

  try {
    console.log(`🔹 SUPPORTING DOCUMENT: Calling ChecklistService.uploadSupportingDocument()`);
    console.log(`🔹 API Call: POST /api/checklists/questions/${questionId}/documents/vendor/${selectedVendorId}`);
    
    // Upload supporting document to DigitalOcean Spaces via backend (supporting-docs/ folder)
    const uploadResult = await ChecklistService.uploadSupportingDocument(
      questionId,
      selectedVendorId,
      file
    );

    console.log('🔹 SUPPORTING DOCUMENT: Upload successful:', uploadResult);
    console.log('🔹 File stored in: supporting-docs/ folder');
    
    // ... update UI state
    
  } catch (error) {
    console.error('❌ Error uploading supporting document:', error);
    setSupportDocUploadError('Failed to upload supporting document. Please try again.');
  } finally {
    setIsUploadingSupportDoc(false);
    setUploadingQuestionId(null);
  }
};
```

#### D. Clear UI Separation
Added clear visual indicators showing where files go:

**Checklist Upload Section:**
```jsx
<div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <p className="text-sm text-blue-700">
    📋 <strong>Checklist files uploaded here go to:</strong> <code>checklists/</code> folder in DigitalOcean Spaces
  </p>
  <p className="text-xs text-blue-600 mt-1">
    Supporting documents are uploaded separately in the "Supporting Documents" section
  </p>
</div>
```

**Supporting Documents Section:**
```jsx
<div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
  <p className="text-sm text-green-700">
    📁 <strong>Files uploaded here go to:</strong> <code>supporting-docs/</code> folder in DigitalOcean Spaces
  </p>
  <p className="text-xs text-green-600 mt-1">
    This is separate from checklist uploads which go to the <code>checklists/</code> folder
  </p>
</div>
```

#### E. Separate Error Handling
Each upload type now has its own error display:

```jsx
{/* Checklist Upload Error */}
{uploadError && (
  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
    <p className="text-red-700">{uploadError}</p>
  </div>
)}

{/* Supporting Document Upload Error */}
{supportDocUploadError && (
  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
    <p className="text-red-700">{supportDocUploadError}</p>
  </div>
)}
```

#### F. Updated Upload Button States
Supporting document upload buttons now show specific loading states:

```jsx
{isUploadingSupportDoc && uploadingQuestionId === question.id ? (
  <>
    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
    Uploading to supporting-docs/...
  </>
) : (
  <>
    <Upload className="h-4 w-4 mr-2" />
    Upload Supporting Document
  </>
)}
```

## File Organization Clarification

The questionnaire page now clearly handles two distinct upload workflows:

### 1. Checklist Upload Workflow
- **Section**: "Checklist Upload" 
- **File Types**: PDF, TXT, DOC, DOCX (compliance checklists)
- **Storage**: `checklists/` folder in DigitalOcean Spaces
- **API Endpoint**: `POST /api/checklists/upload`
- **Purpose**: Upload compliance questionnaires for question extraction

### 2. Supporting Document Workflow  
- **Section**: "Supporting Documents"
- **File Types**: PDF, JPG, JPEG, PNG, GIF, DOC, DOCX, TXT (evidence files)
- **Storage**: `supporting-docs/` folder in DigitalOcean Spaces  
- **API Endpoint**: `POST /api/checklists/questions/{questionId}/documents/vendor/{vendorId}`
- **Purpose**: Upload evidence/supporting files for specific questions

## API Integration

Both upload types correctly integrate with the backend DigitalOcean Spaces service:

- **Checklist Service**: `ChecklistService.uploadChecklist()` → stores JSON data in `checklists/` folder
- **Supporting Document Service**: `ChecklistService.uploadSupportingDocument()` → stores files in `supporting-docs/` folder

## Console Logging

Added comprehensive console logging to distinguish between upload types:

- **Checklist uploads**: Use 📋 emoji and "CHECKLIST" prefix
- **Supporting document uploads**: Use 🔹 emoji and "SUPPORTING DOCUMENT" prefix

## Testing

✅ Frontend builds successfully without errors
✅ Vendor dropdown now properly handles API response structures  
✅ Checklist and supporting document uploads are completely separate
✅ Clear visual feedback shows where each file type goes
✅ Separate loading states prevent UI conflicts
✅ Error handling is specific to each upload type

## Verification

Users can now:
1. **See all vendors** in the dropdown (fixed API response handling)
2. **Upload checklists** to `checklists/` folder (blue section) 
3. **Upload supporting documents** to `supporting-docs/` folder (green section)
4. **See clear separation** between the two upload types
5. **Get specific feedback** for each upload workflow

The questionnaire page now provides a clear, separated workflow for both checklist management and supporting document evidence uploads. 