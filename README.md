# Vendor Onboarding Platform

A comprehensive vendor compliance and onboarding platform with a modern UI built with Next.js and Tailwind CSS.

## Project Status

**Completed Features:**
- Top navigation bar with consistent styling across all pages
- Dashboard with overview metrics and activity tracking
- Questionnaires management page with filterable list
- Vendors catalog with risk assessment visualization
- Trust Portal for public-facing compliance information
- Compliance framework tracking and evidence management
- Responsive design that works on all devices
- Accessible UI components following best practices

## Features

### Dashboard
- Overview of compliance status with key metrics
- Quick access to high-risk vendors 
- Pending tasks and recent activity tracking
- Compliance scoring and progress visualization

### Questionnaires
- Manage and track compliance questionnaires
- Filter by type, status, and due dates
- Progress tracking with visual indicators
- Detailed status overview for each assessment

### Vendors
- Vendor catalog with risk assessment indicators
- Compliance scoring for each vendor
- Filtering by category, risk level, and status
- Quick-access vendor details and assessment tools

### Trust Portal
- Public-facing trust and compliance information hub
- Downloadable compliance certifications and reports
- Security practices and infrastructure information
- Designed to build customer confidence in security measures

### Compliance
- Framework-specific compliance tracking (SOC 2, ISO 27001, GDPR, HIPAA)
- Evidence management for compliance documentation
- Progress tracking across all compliance frameworks
- Detailed controls implementation status

## Structure

- `frontend/`: Next.js application with Tailwind CSS
  - `app/`: Next.js app directory structure
    - `dashboard/`: Main dashboard interface
    - `questionnaires/`: Questionnaire management
    - `vendors/`: Vendor management system
    - `trust-portal/`: Customer-facing trust center
    - `compliance/`: Compliance framework tracking
  - `components/`: Reusable UI components
  - `lib/`: Utility functions and shared code
- `backend/`: Express.js API server
- `.github/workflows/`: CI/CD configuration

## Design System

The application uses a consistent design system with:
- Responsive layouts that work on mobile and desktop
- Accessible UI components following WCAG guidelines
- Color-coding for status indicators (success, warning, danger)
- Consistent spacing, typography, and component designs
- Interactive elements with proper hover and focus states

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

### 🌐 Environment Variables Setup

To configure environment-specific settings, copy the example `.env` file and fill in your details:

```bash
cp .env.example .env
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

The import script expects a JSON file named `data_new.json` containing an array of compliance framework objects with the following structure:

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
- Read data from `data_new.json`
- Parse each framework object
- Insert records into the `compliance_frameworks` table in PostgreSQL
- Log progress and results to the console