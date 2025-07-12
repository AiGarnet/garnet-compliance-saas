# 🔍 Feedback System Debugging Checklist

## ✅ **CONFIRMED WORKING:**
- Backend API: `POST /api/trust-portal/feedback` ✅ (Status 201)
- Database: Records being created ✅ 
- CORS: Working correctly ✅
- Validation: All data formats accepted ✅

## 🎯 **DEBUGGING STEPS:**

### 1. **Clear Browser Cache**
```bash
# Clear all cache, cookies, and local storage for www.garnetai.net
# Or use incognito/private browsing mode
```

### 2. **Check Browser Developer Tools**
Open the trust portal page and check:

#### **Network Tab:**
- Look for requests to `/api/trust-portal/feedback`
- Check if they're returning 201 (success) or 400/404 (error)
- Look for multiple requests being made

#### **Console Tab:**
- Look for JavaScript errors
- Check for failed promises or async errors
- Look for CORS errors (should be none)

#### **Application Tab:**
- Clear Local Storage
- Clear Session Storage
- Clear Cookies for www.garnetai.net

### 3. **Test Specific Scenarios**

#### **Scenario A: Direct API Test**
```javascript
// Run this in browser console on www.garnetai.net
fetch('/api/trust-portal/feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    vendorId: 1,
    enterpriseContactName: 'Console Test',
    enterpriseContactEmail: 'console@test.com',
    feedbackType: 'general',
    priority: 'medium',
    subject: 'Console Test',
    message: 'Testing from browser console',
    inviteToken: '1752213296666_ww369dkf4'
  })
})
.then(r => r.json())
.then(d => console.log('SUCCESS:', d))
.catch(e => console.error('ERROR:', e));
```

#### **Scenario B: Check Frontend Code**
Look for these potential issues in the frontend:
- Multiple event listeners on form submission
- Race conditions between POST and GET requests
- Error handling that doesn't properly catch 201 responses
- Form validation that prevents submission

### 4. **Check Specific Frontend Files**

#### **TrustPortalClient.tsx**
- Line ~152: `handleSubmitFeedback` function
- Check if `response.ok` is being handled correctly
- Look for any additional API calls after successful submission

#### **FeedbackCard.tsx**
- Check if it's making GET requests to `/api/trust-portal/feedback`
- This might be causing the 404 errors you're seeing

### 5. **Database Verification**
```sql
-- Check if feedback is being created
SELECT id, vendor_id, enterprise_contact_email, subject, status, created_at 
FROM trust_portal_feedback 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🔍 **What to Look For:**

### **If You See 201 Status:**
- ✅ Backend is working
- ❌ Frontend error handling issue
- Check: JavaScript console for errors

### **If You See 400 Status:**
- ❌ Validation error
- Check: Request payload format
- Check: Required fields missing

### **If You See 404 Status:**
- ❌ Wrong endpoint being called
- Check: URL in network tab
- Check: GET vs POST method

### **If You See CORS Errors:**
- ❌ Origin mismatch
- Check: Request origin header
- Check: Backend CORS configuration

## 🚀 **Quick Fixes:**

### **Fix 1: Force Refresh Frontend**
```bash
# Hard refresh the page
Ctrl + F5 (Windows) / Cmd + Shift + R (Mac)
```

### **Fix 2: Check Form Submission**
```javascript
// Add this to handleSubmitFeedback in TrustPortalClient.tsx
console.log('Submitting feedback:', feedbackForm);
console.log('Response status:', response.status);
console.log('Response ok:', response.ok);
```

### **Fix 3: Disable GET Request (if causing 404)**
```javascript
// In FeedbackCard.tsx, temporarily comment out the fetch call
// const response = await fetch(`${backendUrl}/api/trust-portal/feedback`, {
//   method: 'GET',
//   headers: {
//     'Authorization': `Bearer ${token}`,
//     'Content-Type': 'application/json',
//   },
// });
```

## 📋 **Report Back:**
After checking these items, report:
1. What you see in the Network tab
2. Any console errors
3. Whether the database shows new records
4. The exact error message you're getting

## 🎯 **Expected Result:**
You should see:
- Network tab: POST request with 201 status
- Console: No errors
- Database: New feedback record created
- UI: Success message displayed 