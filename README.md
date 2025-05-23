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

### 🧪 Running in Mock/Test Mode

You can spin up the application using lightweight test data for development using:

```bash
npm run dev:mock
```

This command:
- Seeds mock data from `data_new.json` using `scripts/seed-test-data.js`
- Launches both frontend and backend servers with `NODE_ENV=mock`

### ⚙️ Environment Variables Setup

Copy the sample file and populate values:

```bash
cp .env.example .env
```

Ensure you configure the following keys:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `PORT`
- `NEXT_PUBLIC_API_URL`

### 💾 Database Setup

You can run Postgres locally in one of two ways:

**Option 1: Using Docker**

```bash
docker-compose up -d db
```

**Option 2: Manual Setup**

Install Postgres and create the DB manually:

```bash
createdb garnet_ai
```

Ensure .env values match your local database credentials.

### 🚑 Troubleshooting

- **Port already in use:**  
  Run `lsof -i :PORT` and then `kill -9 PID` to free the port.

- **Database connection refused:**  
  Make sure PostgreSQL is running and your .env values are correct.

- **Reset Docker volumes:**  
  Run `docker-compose down -v` to remove all persisted data.

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
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});
```

## Data Format

The import script expects a JSON file named `data_new.json` containing an array of compliance framework objects with the following structure:

```json
[
  {
        "name": "Privacy and Electronic Communications Regulations (PECR)",
        "type": "Regulation",
        "description": "UK regulations description....",
        "jurisdiction": "United Kingdom",
        "domains": ["Electronic Communications", "Cookies", "Direct Marketing", "Privacy"],
        "region": "Europe",
        "requirement": "Obtain user consent for cookies and ensure confidentiality of communications in direct marketing activities.",
        "effective_date": "2003-12-11",
        "last_updated": "2023-01-01",
        "official_url": "url",
        "category": "Data Privacy"
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

## Security Questionnaire Module

The Security Questionnaire Module helps enterprise sales and compliance teams respond accurately to security questionnaires using AI. This module analyzes security-related questions and generates precise answers based on the company's compliance data.

### Setup

1. **API Key**
   - Create an OpenAI API key (if you don't have one)
   - Create a `.env` file in the `/backend` directory using the `.env.example` template
   - Add your OpenAI API key to the `.env` file (NEVER commit this to source control)

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the Module**
   - Navigate to `http://localhost:3000/security-questionnaire` in your browser
   - Enter security questions and receive answers based on your company's compliance data

### Security Considerations

- Never expose your API key in client-side code or commit it to version control
- All answers should be reviewed by a compliance officer before sending to customers
- The system only uses information from your compliance dataset - it will not fabricate answers