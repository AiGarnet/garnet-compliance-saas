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

# Garnet AI Compliance Framework Importer

This tool imports compliance framework data from a JSON file into a PostgreSQL database for the Garnet AI SaaS vendor compliance platform.

## Setup

1. Ensure PostgreSQL is running and the `garnet_ai` database has been created using the schema in `schema.sql`
2. Install dependencies:
   ```
   npm install
   ```

## Configuration

The database connection details are configured in `import_data.js`. Modify these settings as needed:

```javascript
const pool = new Pool({
  host: 'GarnetAI',  // Server name
  port: 5432,
  database: 'garnet_ai',  // Database name
  user: 'postgres',
  password: 'Sonasuhani1'
});
```

## Data Format

The import script expects a JSON file named `Dataset.json` containing an array of compliance framework objects with the following structure:

```json
[
  {
    "name": "GDPR",
    "type": "Privacy",
    "jurisdiction": "European Union",
    "description": "General Data Protection Regulation...",
    "domains": ["Data Privacy", "Consumer Protection"],
    "region": "Europe"
  },
  ...
]
```

## Running the Import

To run the import:

```
npm run import
```

The script will:
- Read data from `Dataset.json`
- Parse each framework object
- Insert records into the `compliance_frameworks` table in PostgreSQL
- Log progress and results to the console