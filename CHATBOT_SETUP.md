# 🤖 GarnetAI Compliance Chatbot Setup Guide

## Overview

This lightweight chatbot system provides AI-powered answers to security and compliance questions using the `data_new.json` compliance framework database and OpenAI's GPT-4 model. The system now features **vendor impersonation** for answering customer-directed questions.

## ✅ System Status

**COMPLETED**: The chatbot system is now fully functional and integrated with the live site at https://testinggarnet.netlify.app/questionnaires

### What's Working:
- ✅ Backend API server running on port 5000
- ✅ Frontend integration on `/questionnaires` page
- ✅ OpenAI GPT-4 integration for intelligent responses
- ✅ Compliance data context from `data_new.json` (384 frameworks)
- ✅ Real-time question answering
- ✅ Chat history functionality
- ✅ **NEW**: Vendor impersonation for customer-directed questions
- ✅ **NEW**: Dynamic question type detection
- ✅ **NEW**: Context-aware response modes

## 🛠️ Architecture

### Backend (Node.js/Express)
- **Location**: `chatbot/server/server.js`
- **Port**: 5000
- **Endpoints**:
  - `POST /ask` - Main chatbot endpoint (used by frontend)
  - `POST /api/answer` - Alternative endpoint (with question type classification)
  - `GET /status` - Server status and compliance data info
  - `GET /health` - Health check

### Frontend (React/Next.js)
- **Location**: `frontend/app/questionnaires/page.tsx`
- **Port**: 3000
- **Features**:
  - Compliance Assistant section with question input
  - Real-time AI responses with vendor impersonation
  - Chat history with localStorage persistence
  - Error handling and loading states

## 🎭 NEW: Vendor Impersonation Feature

### How It Works

The chatbot now detects **vendor-directed questions** and automatically switches to vendor impersonation mode:

#### Vendor-Directed Questions (Impersonation Mode):
- **Trigger phrases**: "How does your company", "Are you compliant with", "Do you have", "What steps do you take", etc.
- **Response style**: Speaks as the SaaS vendor using "we", "our company", "our organization"
- **Temperature**: 0.5 (more confident, professional tone)
- **Context**: Uses top 10 most relevant compliance frameworks

#### General Questions (Assistant Mode):
- **Example**: "What are the requirements of GDPR?"
- **Response style**: Neutral compliance assistant providing guidance
- **Temperature**: 0.4 (focused, informative tone)
- **Context**: Uses top 10 most relevant compliance frameworks

### Question Type Detection

The system automatically detects question types based on these phrases:

```javascript
Vendor-directed phrases:
- "how does your company"
- "do you have" 
- "are you compliant with"
- "how is your data handled"
- "what measures do you follow"
- "how do you ensure"
- "does your organization"
- "can you provide"
- "what steps do you take"
- "how do you manage"
- "what policies do you have"
- "how do you handle"
- "are you certified"
- "do you maintain"
- "what security measures"
- "how do you protect"
- "do you comply with"
- "what compliance frameworks"
```

## 🔧 Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Database (optional for chatbot)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=garnet_ai
DB_USER=postgres
DB_PASSWORD=

# Backend server port
PORT=5000

# Frontend environment variables
NEXT_PUBLIC_API_URL=http://localhost:5000

# OpenAI API Key - REQUIRED
OPENAI_API_KEY=sk-your_actual_openai_api_key_here
```

**⚠️ IMPORTANT**: Replace `sk-your_actual_openai_api_key_here` with your actual OpenAI API key.

### 2. Install Dependencies

```bash
# Install chatbot server dependencies
cd chatbot/server
npm install

# Install frontend dependencies (if not already done)
cd ../../frontend
npm install
```

### 3. Start the Services

#### Start Backend (Chatbot API):
```bash
cd chatbot/server
npm start
# or for development with auto-reload:
npm run dev
```

#### Start Frontend:
```bash
cd frontend
npm run dev
```

## 🧠 AI Prompt Construction

The system uses different prompt structures based on question type:

### Vendor Impersonation Mode (Customer Questions)

**System Prompt:**
```
You are answering as a SaaS vendor that follows GDPR, ISO 27001, and other European and Southeast Asian regulatory frameworks. You implement comprehensive security and compliance measures based on industry best practices.

When answering, speak as the vendor ("we", "our company", "our organization") and provide specific, confident responses about your compliance practices. Draw from the compliance framework information provided to demonstrate how you meet various regulatory requirements.

Use the following compliance information as the basis for your vendor's practices:
```

**User Prompt:**
```
Reference Information: [filtered compliance data]

Answer the following question from a prospective enterprise client, as if you are the vendor:

Q: [user question]
A:
```

### Assistant Mode (General Questions)

**System Prompt:**
```
You are a security and compliance assistant for SaaS vendors. Use the following reference information to answer the user's question accurately and concisely. Provide helpful guidance about compliance frameworks and security best practices.
```

**User Prompt:**
```
Reference Information: [filtered compliance data]

Q: [user question]
```

## 🌐 Live Integration

### Local Development:
- Frontend: http://localhost:3000/questionnaires
- Backend API: http://localhost:5000/ask

### Production:
- Frontend: https://testinggarnet.netlify.app/questionnaires
- Backend: Uses Netlify Functions (configured in frontend)

## 📊 Compliance Data

The system uses `data_new.json` which contains:
- **384 compliance frameworks**
- **Categories**: Data Privacy, Financial Privacy, Cybersecurity, etc.
- **Regions**: Europe, North America, Asia-Pacific, International
- **Frameworks**: GDPR, HIPAA, SOC2, ISO 27001, CCPA, PDPA, etc.

## 🔍 Testing the System

### Test Backend API:
```bash
# Test status endpoint
curl http://localhost:5000/status

# Test vendor-directed question
curl -X POST http://localhost:5000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "How does your company manage GDPR compliance?"}'

# Test general question
curl -X POST http://localhost:5000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the requirements of GDPR?"}'
```

### Test Frontend:
1. Navigate to http://localhost:3000/questionnaires
2. Scroll to "Compliance Assistant" section
3. Test vendor-directed questions:
   - "How does your company manage GDPR compliance?"
   - "Are you compliant with ISO 27001?"
   - "What steps do you take to detect security incidents?"
4. Test general questions:
   - "What are the requirements of GDPR?"
   - "What is ISO 27001?"
5. Notice the different response styles

## 🚀 Example Questions

### Vendor-Directed Questions (Impersonation Mode):
- "How does your company manage GDPR compliance?"
- "Are you compliant with ISO 27001?"
- "What steps do you take to detect security incidents?"
- "How do you ensure data privacy in your systems?"
- "Do you have SOC 2 certification?"
- "What measures do you follow for incident response?"
- "How do you handle cross-border data transfers?"
- "Are you certified under any compliance frameworks?"

### General Questions (Assistant Mode):
- "What are the requirements of GDPR?"
- "What is ISO 27001?"
- "What are the key principles of data protection?"
- "What are the penalties for GDPR non-compliance?"

## 🔧 Troubleshooting

### Common Issues:

1. **"OpenAI API key not configured"**
   - Ensure `.env` file exists with valid `OPENAI_API_KEY`
   - Copy `.env` to `chatbot/.env` if needed

2. **"Unable to connect to the remote server"**
   - Check if backend is running on port 5000
   - Verify no other service is using port 5000

3. **"Failed to get answer from chatbot"**
   - Check backend logs for OpenAI API errors
   - Verify API key has sufficient credits
   - Check network connectivity

4. **Frontend not connecting to backend**
   - Verify frontend is pointing to correct backend URL
   - Check CORS configuration in backend

5. **Vendor impersonation not working**
   - Check if question contains vendor-directed phrases
   - Review server logs for question type detection
   - Verify compliance data is loading correctly

### Logs and Debugging:

- Backend logs: Check console output when running `npm start`
- Frontend logs: Check browser developer console
- Network requests: Monitor in browser Network tab
- Question type detection: Use `/api/answer` endpoint to see question classification

## 📝 API Documentation

### POST /ask
Request:
```json
{
  "question": "How does your company manage GDPR compliance?"
}
```

Response:
```json
{
  "answer": "Our company takes GDPR compliance very seriously and has implemented a comprehensive set of measures..."
}
```

### POST /api/answer (with question type classification)
Request:
```json
{
  "question": "How does your company manage GDPR compliance?"
}
```

Response:
```json
{
  "question": "How does your company manage GDPR compliance?",
  "answer": "Our company takes GDPR compliance very seriously...",
  "question_type": "vendor_directed"
}
```

### GET /status
Response:
```json
{
  "status": "ok",
  "timestamp": "2025-05-23T17:09:46.935Z",
  "compliance_data": {
    "total_frameworks": 384,
    "categories": ["Data Privacy", "Financial Privacy", ...]
  },
  "features": {
    "vendor_impersonation": true,
    "question_type_detection": true,
    "dynamic_prompting": true
  }
}
```

## 🔐 Security Notes

- Never commit `.env` files to version control
- Keep OpenAI API keys secure
- Monitor API usage and costs
- Implement rate limiting for production use
- Consider adding authentication for production deployment
- The vendor impersonation feature should be configured with actual company policies

## 📈 Next Steps

Potential enhancements:
- Add company-specific compliance customization
- Implement more sophisticated vendor profile configuration
- Add source citations for vendor claims
- Include compliance evidence and documentation links
- Add conversation memory for multi-turn vendor conversations
- Implement feedback collection for vendor responses
- Add analytics for question type distribution
- Create vendor response quality metrics 