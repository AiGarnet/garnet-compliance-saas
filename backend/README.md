# Backend API

Express.js backend API for the monorepo project.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Run the development server:
```bash
npm run dev
```

## Available Scripts

- `npm run build`: Build the TypeScript project
- `npm run start`: Start the production server
- `npm run dev`: Start the development server with hot reload
- `npm run lint`: Run ESLint
- `npm test`: Run Jest tests

## API Endpoints

- `GET /`: Welcome message
- `GET /api/status`: API status check
- `GET /ping`: Returns "pong" (health check endpoint) 