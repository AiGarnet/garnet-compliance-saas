# GarnetAI Compliance Chatbot

A lightweight chatbot system that answers compliance-related questions using the OpenAI API and the provided compliance framework data.

## Features

- **Data-Driven Responses**: Uses the compliance framework data from `data_new.json` to provide accurate answers
- **Integrated with Frontend**: Seamlessly integrates with the questionnaires page
- **Simple API**: Single endpoint for processing questions and returning answers
- **Chat History**: Stores recent questions and answers for reference

## Setup Instructions

### Backend Setup

1. Navigate to the server directory:
   ```
   cd chatbot/server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the `chatbot` directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_actual_api_key
   ```

4. Start the server:
   ```
   npm start
   ```
   
   The server will be available at http://localhost:3001.

### API Details

#### POST /api/answer

Processes compliance questions and returns AI-generated answers.

**Request:**
```json
{
  "question": "What is GDPR and how does it affect my business?"
}
```

**Response:**
```json
{
  "answer": "GDPR (General Data Protection Regulation) is an EU regulation that..."
}
```

### Development

For development with auto-restart on code changes:
```
npm run dev
```

## Architecture

```
chatbot/
├── server/
│   ├── server.js        # Main API server
│   └── package.json     # Dependencies and scripts
└── README.md            # Documentation
```

## Integration with Frontend

The chatbot is integrated with the frontend at `/questionnaires` page. The integration:

1. Adds a compliance question form at the top of the page
2. Sends questions to the backend API
3. Displays answers in a formatted response box
4. Maintains a history of recent questions and answers

## Technical Details

- **OpenAI Model**: Uses GPT-4 Turbo for generating accurate responses
- **Context**: Sends the entire compliance framework data as context
- **Prompt Structure**:
  ```
  "You are a security and compliance assistant for SaaS vendors. Use the following reference information to answer the user's question accurately and concisely:"
  [compliance data]
  Q: [user question]
  ```

## Troubleshooting

- **API Key Issues**: Make sure your OpenAI API key is valid and has sufficient quota
- **Connection Problems**: Check that the backend server is running on port 3001
- **Large Responses**: If responses are too long, adjust the `max_tokens` parameter in `server.js` 