# GARNET Frontend

This is the frontend application for GARNET, built with Next.js.

## Getting Started

To run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication System

GARNET now features a frontend-based authentication system that handles user signup and login without requiring a backend database. This approach simplifies development and testing while maintaining security.

### Features:

- JWT-based authentication
- Secure cookie storage for tokens
- In-memory user storage (in a production app, this would use a real database)
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

### Protected Routes:

Routes requiring authentication are defined in `lib/middleware.ts`. Currently protected paths include:

- `/dashboard/*`
- `/admin/*`
- `/questionnaires/*`
- `/compliance/*`
- `/vendors/*`

Unauthenticated users will be redirected to the home page.

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
- `npm run start`: Start the production server
- `npm run lint`: Run ESLint
- `npm test`: Run Jest tests

## Features

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS for styling
- ESLint
- Jest for testing 