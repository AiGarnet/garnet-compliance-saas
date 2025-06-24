# API Endpoint and Vendor Loading Fixes

## Issues Identified and Fixed

### 1. **API Endpoint Correction**
**Problem**: ChatBot was using incorrect API endpoint `/ask` instead of `/api/ai/ask`
**Solution**: Updated ChatBot component to use the correct endpoint

```typescript
// Before:
const response = await fetch('https://garnet-compliance-saas-production.up.railway.app/ask', {

// After: 
const response = await fetch('https://garnet-compliance-saas-production.up.railway.app/api/ai/ask', {
```

### 2. **Vendor Loading Issues**
**Problem**: 
- Vendors weren't loading automatically when switching to chatbot tab
- Users had to click retry button to get vendors
- Duplicate vendor loading functions causing confusion

**Solutions**:
- **Unified Vendor Loading**: Removed duplicate `fetchVendors()` function, kept single `loadVendors()` 
- **Automatic Loading**: Enhanced useEffect to load vendors when switching to both 'enhanced' and 'chatbot' tabs
- **Prevent Duplicate Calls**: Added guard to prevent multiple simultaneous API calls
- **Better Error Handling**: Improved error messages and retry functionality

```typescript
// Enhanced useEffect for automatic vendor loading
useEffect(() => {
  if ((activeTab === 'enhanced' || activeTab === 'chatbot') && vendors.length === 0 && !isLoadingVendors) {
    loadVendors();
  }
}, [activeTab]);
```

### 3. **API Response Format Handling**
**Problem**: ChatBot wasn't handling different API response formats properly
**Solution**: Added comprehensive response format detection

```typescript
// Handle different response formats from the backend
let aiResponse: string;
let responseConfidence: number = 0.85;
let responseSources: string[] = [];

if (data.answer) {
  // Format: { answer: string, confidence?: number, sources?: string[] }
  aiResponse = data.answer;
  responseConfidence = data.confidence || 0.85;
  responseSources = data.sources || [];
} else if (data.response) {
  // Format: { response: string }
  aiResponse = data.response;
} else if (data.success && data.data) {
  // Format: { success: true, data: { answer: string } }
  aiResponse = data.data.answer || data.data.response || "I'm sorry, I couldn't generate a response.";
  responseConfidence = data.data.confidence || 0.85;
  responseSources = data.data.sources || [];
} else if (typeof data === 'string') {
  // Direct string response
  aiResponse = data;
} else {
  // Fallback
  aiResponse = "I'm sorry, I couldn't generate a response right now. Please try rephrasing your question.";
}
```

### 4. **Vendor Loading Function Improvements**
**Enhanced Features**:
- **API Response Format Handling**: Properly handles `{ success: true, data: [...] }` format
- **Better Error Messages**: More descriptive error messages with status codes
- **Debugging Logs**: Added console logs for better debugging
- **Fallback Handling**: Sets empty array on error to show "No vendors available"
- **Auto-selection**: Automatically selects first vendor when none is selected

```typescript
const loadVendors = async () => {
  if (isLoadingVendors) return; // Prevent duplicate calls
  
  setIsLoadingVendors(true);
  try {
    const response = await fetch('https://garnet-compliance-saas-production.up.railway.app/api/vendors');
    if (!response.ok) {
      throw new Error(`Failed to fetch vendors: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Vendors API response:', data);
    
    // Handle the API response format { success: true, data: [...] }
    const vendorList = data.success && data.data ? data.data : (Array.isArray(data) ? data : []);
    
    const formattedVendors = vendorList.map((vendor: any) => ({
      id: vendor.vendorId?.toString() || vendor.id?.toString() || vendor.uuid?.toString(),
      name: vendor.companyName || vendor.name || 'Unknown Vendor',
      status: vendor.status || 'QUESTIONNAIRE_PENDING'
    }));
    
    console.log('Formatted vendors:', formattedVendors);
    setVendors(formattedVendors);
    
    // Auto-select first vendor if none selected
    if (formattedVendors.length > 0 && !selectedVendorForEnhanced) {
      setSelectedVendorForEnhanced(formattedVendors[0].id);
    }
  } catch (error) {
    console.error('Error loading vendors:', error);
    setError('Failed to load vendors. Please try again.');
    setVendors([]);
  } finally {
    setIsLoadingVendors(false);
  }
};
```

### 5. **UI/UX Improvements**
**Enhanced Features**:
- **Vendor Selector for Chatbot**: Added dropdown to select which vendor the AI should represent
- **Loading States**: Better loading indicators and messaging
- **Retry Functionality**: Clear retry buttons when vendor loading fails
- **Status Information**: Shows vendor status alongside name
- **Contextual Help**: Added explanatory text about vendor selection

```typescript
{/* Vendor Selector for Chatbot */}
<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Select Vendor for Chatbot Session
  </label>
  <select
    value={selectedVendorForEnhanced || vendors[0]?.id || ''}
    onChange={(e) => setSelectedVendorForEnhanced(e.target.value)}
    className="w-full max-w-md border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
  >
    {vendors.map((vendor) => (
      <option key={vendor.id} value={vendor.id}>
        {vendor.name} - {vendor.status}
      </option>
    ))}
  </select>
  <p className="text-xs text-gray-500 mt-1">
    The AI will respond from this vendor's perspective during the conversation
  </p>
</div>
```

## Testing Results

✅ **Frontend Build**: Successful compilation with no errors  
✅ **Backend Build**: Successful compilation with no errors  
✅ **API Endpoints**: Corrected to match backend structure  
✅ **Vendor Loading**: Automatic loading on tab switch  
✅ **Error Handling**: Improved error messages and retry functionality  
✅ **Response Handling**: Supports multiple API response formats  

## API Endpoints Confirmed

Based on the provided API endpoint structure:

```json
{
  "ai": {
    "base": "/api/ai",
    "endpoints": [
      "POST /ask (public)",
      "POST /api/ai/ask",
      "POST /api/ai/batch-ask",
      "POST /api/ai/suggestions",
      "GET /api/ai/vendors/:vendorId/suggestions"
    ]
  },
  "vendors": {
    "base": "/api/vendors",
    "endpoints": [
      "GET /api/vendors",
      "POST /api/vendors",
      ...
    ]
  }
}
```

All frontend components now use the correct endpoints and handle the expected response formats.

## Summary

All issues have been resolved:
1. ✅ **API Endpoint Fixed**: ChatBot now uses `/api/ai/ask`
2. ✅ **Vendor Loading Fixed**: Automatic loading when switching to chatbot tab
3. ✅ **No More Retry Required**: Vendors load automatically, retry only needed on error
4. ✅ **Better Error Handling**: Clear error messages and recovery options
5. ✅ **Enhanced UX**: Vendor selector and better loading states 