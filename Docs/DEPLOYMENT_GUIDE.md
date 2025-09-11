# Document Checker Deployment Guide

## 🚀 **Production Deployment Steps**

This guide outlines the steps needed to deploy the new document checker functionality to your production environment.

---

## 📋 **Current Status**

✅ **Database**: Successfully migrated with new columns  
✅ **Local Development**: All functionality implemented and tested  
❌ **Production API**: New endpoints not yet deployed (404 error on `/api/documents/validate`)

---

## 🔧 **Deployment Steps**

### **1. Code Deployment**
The new code needs to be pushed to your production environment:

```bash
# 1. Commit all changes
git add .
git commit -m "feat: implement document checker with confidence scoring and relevance API"

# 2. Push to production branch (adjust branch name as needed)
git push origin main  # or your production branch
```

### **2. Verify Environment Variables**
Ensure your production environment has the required environment variables:

```env
# Required for AI-enhanced document detection and relevance checking
OPENAI_API_KEY=your_openai_api_key_here

# Database (should already be configured)
DATABASE_URL=postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway
```

### **3. Railway Deployment**
If using Railway for deployment:

1. **Automatic Deployment**: Railway should automatically deploy when you push to the connected branch
2. **Manual Deployment**: You can trigger a manual deployment from the Railway dashboard
3. **Check Deployment Status**: Monitor the deployment logs in Railway dashboard

### **4. Verify Dependencies**
Ensure all required npm packages are installed in production:

```json
// These should already be in package.json
{
  "openai": "^4.104.0",
  "pg": "^8.16.3", 
  "axios": "^1.10.0",
  "form-data": "^4.0.3"
}
```

### **5. Database Migration Verification**
The database migration has already been applied, but you can verify:

```bash
# Run the database check script to verify schema
node check_and_update_db.js
```

---

## 🧪 **Testing Production Deployment**

### **1. Health Check**
```bash
curl https://garnet-compliance-saas-production.up.railway.app/health
```

### **2. Test New API Endpoint**
```bash
# This should return a proper response (not 404) after deployment
curl -X POST https://garnet-compliance-saas-production.up.railway.app/api/documents/validate \
  -F "questionId=test-id" \
  -F "file=@test-document.txt"
```

### **3. Run Comprehensive Tests**
```bash
# Update the test script to use production URL and run
node test_document_checker.js
```

---

## 📂 **Files That Need to be Deployed**

### **New Files** (must be included in deployment):
```
src/documents/
├── documents.module.ts
├── documents.service.ts
└── documents.controller.ts

migrations/
└── 015_add_document_detection_fields.sql
```

### **Modified Files** (must be updated in production):
```
src/checklists/
├── checklists.service.ts
├── dto/checklist.dto.ts
└── entities/checklist.entity.ts

src/app.module.ts
package.json (if dependencies were added)
```

---

## 🔍 **Troubleshooting**

### **404 Error on `/api/documents/validate`**
**Cause**: DocumentsModule not deployed or not properly imported  
**Solution**: 
1. Verify `src/app.module.ts` includes `DocumentsModule` in imports
2. Ensure all files in `src/documents/` directory are deployed
3. Check deployment logs for any import errors

### **Database Connection Issues**
**Cause**: Database URL or credentials incorrect  
**Solution**:
1. Verify `DATABASE_URL` environment variable
2. Run `node check_and_update_db.js` to test connection
3. Check Railway database status

### **OpenAI API Issues**
**Cause**: Missing or invalid `OPENAI_API_KEY`  
**Solution**:
1. Set `OPENAI_API_KEY` in production environment
2. System will fallback to keyword-only detection if OpenAI unavailable

---

## 📊 **Expected Results After Deployment**

### **API Endpoints Available**:
- ✅ `POST /api/documents/validate` - Document relevance checking
- ✅ Enhanced question parsing with confidence scores
- ✅ All existing endpoints continue to work

### **Database Schema**:
- ✅ `requires_document_confidence_score` column
- ✅ `requires_document_reason` column  
- ✅ Performance index created

### **Test Results**:
- ✅ Document detection logic: 5/5 tests passing
- ✅ API health check: Production server accessible
- ✅ Document relevance API: Should work after deployment

---

## 🎯 **Next Steps**

1. **Deploy the code** to production (push to main branch)
2. **Wait for deployment** to complete (check Railway dashboard)
3. **Test the new endpoint** using the provided curl commands
4. **Run the test suite** to verify everything works
5. **Monitor logs** for any issues

---

## 📞 **Support**

If you encounter any issues during deployment:

1. **Check Railway Deployment Logs**: Look for any build or runtime errors
2. **Verify Environment Variables**: Ensure all required env vars are set
3. **Test Database Connection**: Run the database check script
4. **Check File Structure**: Ensure all new files are included in the deployment

The implementation is complete and ready for production - it just needs to be deployed to your Railway environment! 