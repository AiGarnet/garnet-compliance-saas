# Frontend App

Next.js frontend for the monorepo project.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Pages

- `/` - Home page with a welcome message and a link to the dashboard
- `/dashboard` - A simple dashboard with example UI components

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm run start`: Start the production server
- `npm run lint`: Run ESLint
- `npm test`: Run Jest tests

## Features

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS for styling
- ESLint
- Jest for testing

## PostgreSQL Integration for Waitlist Feature

The waitlist signup feature can now work directly with PostgreSQL instead of requiring a backend server. To use this feature:

1. Make sure you have PostgreSQL installed and running
2. Create a database named `garnet_ai` (or any name you prefer)
3. Create the users table with the following schema:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  organization TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

4. Copy `.env.local.example` to `.env.local` and update the `DATABASE_URL` with your PostgreSQL connection string

With this setup, the waitlist form will directly insert user data into the PostgreSQL database. If the database connection fails or is not configured, it will fall back to storing users in a JSON file in the public directory.

# Questionnaire Chat Interface

## Overview

This update adds a chatbot-style interface for interacting with questionnaires. The system now includes:

1. A form for creating questionnaires that submits to `/api/questionnaires` and redirects to a chat interface
2. A chat interface at `/questionnaires/[id]/chat` for viewing and interacting with questionnaires
3. Updated navigation in the QuestionnaireList component to link to the chat interface

## Key Files Modified

- `app/questionnaires/page.tsx` - Updated the form submission handler to send POST requests to the API and redirect to the chat page
- `app/questionnaires/[id]/chat/page.tsx` - Created a new chat interface for interacting with questionnaires
- `app/api/questionnaires/route.ts` - Added API endpoint for creating questionnaires
- `app/api/questionnaires/[id]/route.ts` - Added API endpoint for fetching questionnaire data
- `components/dashboard/QuestionnaireList.tsx` - Updated the View button to navigate to the chat interface

## API Endpoints

- `POST /api/questionnaires` - Create a new questionnaire with title and questions
- `GET /api/questionnaires/[id]` - Fetch a questionnaire by ID

## Next Steps

- Implement saving answers in the chat interface
- Add AI-powered assistance for generating responses
- Add support for editing and deleting questions in the chat interface
- Implement real database storage for questionnaires instead of mocked responses