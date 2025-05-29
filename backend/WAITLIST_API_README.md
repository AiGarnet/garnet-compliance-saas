# GARNET Waitlist API Integration Guide

## Overview

The waitlist API is now deployed and available at:
**https://garnet-compliance-saas-production.up.railway.app/**

This API allows users to join the GARNET waitlist by submitting their information through a form on the landing page.

## Live Implementation

The API is integrated with the Netlify landing page at:
**https://testinggarnet.netlify.app/**

When users click the "Join Waitlist" button on the landing page, their information is submitted to the Railway backend, and the data is stored in the PostgreSQL database.

## API Endpoints

### Health Check
```
GET https://garnet-compliance-saas-production.up.railway.app/
```

### Join Waitlist
```
POST https://garnet-compliance-saas-production.up.railway.app/join-waitlist
```

## Integration Instructions

### Frontend Implementation

Add the following code to your frontend to submit the waitlist form:

```javascript
async function submitToWaitlist(formData) {
  try {
    const apiUrl = 'https://garnet-compliance-saas-production.up.railway.app/join-waitlist';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.error || 'Failed to join waitlist';
      throw new Error(errorMessage);
    }
    
    return {
      success: true,
      message: data.message || 'Successfully joined the waitlist!',
      data: data.data
    };
    
  } catch (error) {
    console.error('Waitlist submission error:', error);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred'
    };
  }
}
```

### Example Form Data

```javascript
const formData = {
  email: "user@example.com",   // Required
  name: "John Doe",            // Optional
  company: "Example Corp",     // Optional
  role: "Developer",           // Optional
  interests: "AI, Compliance"  // Optional
};
```

### Response Format

**Success (201):**
```json
{
  "success": true,
  "message": "Successfully joined the waitlist!",
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "John Doe",
    "company": "Example Corp",
    "role": "Developer",
    "interests": "AI, Compliance",
    "created_at": "2023-11-01T12:00:00.000Z"
  }
}
```

**Error (400, 409, 500):**
```json
{
  "error": "Error message here"
}
```

## Testing

You can test the API using curl:

```bash
curl -X POST https://garnet-compliance-saas-production.up.railway.app/join-waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "company": "Test Company",
    "role": "Developer",
    "interests": "AI, Compliance"
  }'
```

## Features

- The API automatically creates and modifies the database table structure based on the form fields you submit
- Email validation is performed on the server side
- Duplicate emails are rejected with a 409 Conflict status
- CORS is configured to allow requests from the Netlify site

For more detailed documentation, please refer to the [full API documentation](./WAITLIST_SERVER.md). 