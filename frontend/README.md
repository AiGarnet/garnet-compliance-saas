# GARNET Frontend

This is the frontend application for GARNET, built with Next.js.

## Getting Started

To run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication System

GARNET features a frontend-based authentication system that handles user signup and login with PostgreSQL database storage.

### Features:

- JWT-based authentication
- Secure cookie storage for tokens
- PostgreSQL database storage for users
- Protected routes with middleware
- Password hashing with bcrypt

### Auth Utilities:

All authentication utilities are available in the `lib/auth.ts` file:

- `signup()` - Register a new user
- `login()` - Authenticate an existing user
- `logout()` - End the current session
- `isAuthenticated()` - Check if the user is logged in
- `getCurrentUser()` - Get the current user's data
- `getAuthHeaders()` - Get headers for authenticated API requests

## Database Configuration

The application uses PostgreSQL for storing user data. Configuration is in `lib/env.ts`.

### Database Scripts:

- `node scripts/init-db.js` - Initialize the database schema
- `node scripts/check-users.js` - Check for users in the database

## Deploying to Netlify

For detailed deployment instructions, see [README-NETLIFY.md](./README-NETLIFY.md).

Quick start:

```bash
# Install Netlify CLI
npm install netlify-cli -g

# Login to Netlify
netlify login

# Deploy using our script
node scripts/deploy-netlify.js
```

For manual deployment:

```bash
# Clean up unnecessary files
node scripts/cleanup.js

# Build the project
npm run build:netlify

# Deploy to Netlify
netlify deploy --prod
```

## Storybook

To run Storybook:

```bash
npm run storybook
```

## Pages

- `/` - Home page with a welcome message and a link to the dashboard
- `/dashboard` - A simple dashboard with example UI components

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm run build:netlify`: Build for Netlify deployment
- `npm run start`: Start the production server
- `npm run lint`: Run ESLint
- `npm test`: Run Jest tests

## Features

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS for styling
- ESLint
- Jest for testing 