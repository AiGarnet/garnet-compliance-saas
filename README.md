# Monorepo Project

This is a monorepo containing both frontend and backend applications.

## Structure

- `frontend/`: Next.js application
- `backend/`: Express.js API server
- `.github/workflows/`: CI/CD configuration

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Docker and Docker Compose (for containerized setup)

### Local Installation

1. Clone the repository
2. Install dependencies for both projects:

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### Local Development

#### Frontend

```bash
cd frontend
npm run dev
```

#### Backend

```bash
cd backend
npm run dev
```

### Docker Setup

You can run both applications using Docker Compose:

```bash
# Start both services
docker-compose up

# Start in detached mode
docker-compose up -d

# Stop services
docker-compose down
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## CI/CD

This project uses GitHub Actions for continuous integration. See `.github/workflows/ci.yml` for configuration details.