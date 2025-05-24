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