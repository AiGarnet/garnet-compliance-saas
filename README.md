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
- **🤖 AI-Powered Chatbot Microservice** - Flask-based compliance Q&A system using OpenAI GPT-4
- Responsive design that works on all devices
- Accessible UI components following best practices

## Features

### 🤖 AI Chatbot Microservice (NEW)
- **OpenAI GPT-4 Integration**: All answers generated using OpenAI API
- **Compliance Context**: Uses internal policy data for accurate responses  
- **Input Sanitization**: Automatically removes PII and sensitive information
- **Specialized Prompts**: GDPR, SOC 2, HIPAA, and general compliance expertise
- **Security Features**: Input validation, XSS protection, rate limiting ready
- **Health Monitoring**: Built-in endpoints for service health and status
- **Integration Ready**: Works seamlessly with existing questionnaire system

### Dashboard
- Overview of compliance status with key metrics
- Quick access to high-risk vendors 
- Pending tasks and recent activity tracking
- Compliance scoring and progress visualization

### Questionnaires
- Manage and track compliance questionnaires
- **AI-powered question answering** using the chatbot microservice
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
- **`chatbot/`: Flask-based AI chatbot microservice**
  - `app.py`: Main Flask application
  - `services/`: OpenAI API client wrapper
  - `models/`: Prompt templates for different compliance areas
  - `utils/`: Input sanitization and validation
  - `data/`: Compliance data (data_new.json)
  - `tests/`: Comprehensive unit and integration tests
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
2. Install dependencies for all projects:

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Install chatbot dependencies
cd ../chatbot
pip install -r requirements.txt
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

#### 🤖 AI Chatbot Microservice

```bash
cd chatbot

# Create .env file with your OpenAI API key
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env

# Start the Flask service
python start_server.py

# OR run directly
python app.py

# Test the service (in another terminal)
python test_integration.py
```

The chatbot service will start on http://localhost:5000 with these endpoints:
- `GET /health` - Health check
- `GET /status` - Service status and configuration  
- `POST /ask` - Ask compliance questions

**Example Usage:**
```bash
curl -X POST http://localhost:5000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the GDPR data subject rights?"}'
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

# Garnet Compliance UI Component Library

A comprehensive Figma UI component library for the Garnet Compliance SaaS platform, providing consistent design elements for the compliance onboarding experience.

## Project Overview

This library contains the official UI components for Garnet Compliance, created and maintained as a single source of truth for designers and developers. All components are built with Figma Auto Layout, organized into component sets with variant properties, and published through Figma Team Library for easy access across projects.

## Features

- **Consistent Design System**: Standardized components reflecting Garnet's professional design language
- **Auto Layout Components**: All elements built with Figma Auto Layout for responsive behavior
- **Variant Management**: Complete component sets with all necessary states and variants
- **Design Tokens**: Color variables, typography, and spacing tokens for consistent implementation
- **Documentation**: Comprehensive usage guidelines for all components
- **Developer Handoff**: Optimized for seamless developer implementation

## Components Included

### Core Elements
- **Buttons**
  - Primary (Default, Hover, Active, Disabled)
  - Secondary (Default, Hover, Active, Disabled)
  - Tertiary/Text Buttons

### Form Controls
- **Input Fields**
  - Text Input (Default, Active, Error, Disabled)
  - Textarea (Default, Active, Error, Disabled)
  - Dropdown/Select (Default, Open, Disabled)
  - Checkbox (Unchecked, Checked, Indeterminate, Disabled)
  - Radio Buttons (Unselected, Selected, Disabled)

### Content Containers
- **Cards**
  - Vendor Card
  - Questionnaire Summary Card
  - Information Card

### Interactive Elements
- **Modals** (various sizes and configurations)
- **Navigation Bar**
- **Tooltips**
- **Notifications/Alerts**

## File Structure & Organization

The Figma file is organized on a single page with clearly labeled frames:

```
Garnet Compliance UI Library
├── 🎨 Design Tokens
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   └── Shadows
├── 🧩 Components
│   ├── Buttons
│   ├── Form Controls
│   ├── Cards
│   ├── Modals
│   └── Navigation
├── 📱 Responsive Patterns
├── 📝 Examples
└── 📚 Documentation
```

## How to Use the Library in Figma

### For Designers
1. Open your Figma file
2. Navigate to the Assets panel (in the left sidebar)
3. Select "Team Library" from the dropdown
4. Enable the "Garnet Compliance UI Library"
5. Access components through the Assets panel

### For Developers
1. Request access to the Figma file from your design team
2. Reference the Documentation section for implementation details
3. Use the Inspect tab (right sidebar) for specific CSS properties
4. Follow the component specifications in the `components.md` file in the frontend repository

## Setup Instructions for Contributors

To contribute to this component library:

1. Request edit access to the main Figma file
2. Review the existing components and documentation
3. Create your components following established patterns:
   - Use Auto Layout for all components
   - Create component sets with appropriate variants
   - Document usage and properties
4. Submit your additions for review before publishing

## Best Practices

- Always use existing components when available
- Follow naming conventions for new components
- Document any new variants or properties
- Test components at different screen sizes
- Ensure all interactive states are represented

## Credits & Acknowledgments

This component library was created by the Garnet Compliance design team based on specifications from the engineering team. Special thanks to all contributors who have helped establish and maintain these design standards.

## License

MIT License

Copyright (c) 2023 Garnet Compliance

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## API Endpoints

### Question Answering

#### Generate Answers for Multiple Questions

```
POST /api/generate-answers
```

This endpoint accepts a list of questions and returns answers for each question.

**Request Body:**

```json
{
  "questions": [
    "Does your company have a data protection policy?",
    "How do you handle data breaches?",
    "What is your data retention policy?"
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "answers": [
      {
        "question": "Does your company have a data protection policy?",
        "answer": "Yes, our company maintains a comprehensive data protection policy that outlines how we collect, process, store, and secure all types of data within our organization. Our policy is reviewed annually and updated as needed to comply with changing regulations and best practices in data protection."
      },
      {
        "question": "How do you handle data breaches?",
        "answer": "We have a formal incident response plan that includes specific procedures for data breaches. Our approach includes immediate containment, assessment of impact and scope, notification to affected parties within 72 hours as required by GDPR, and a thorough post-incident review to prevent future occurrences."
      },
      {
        "question": "What is your data retention policy?",
        "answer": "Our data retention policy specifies that we keep personal data only as long as necessary for the purposes for which it was collected. Customer data is retained for the duration of the business relationship plus 2 years, while financial records are kept for 7 years to comply with tax regulations. We have automated processes to securely delete data once retention periods expire."
      }
    ],
    "metadata": {
      "totalQuestions": 3,
      "processingTimeMs": 2543,
      "timestamp": "2023-06-15T14:23:45.123Z"
    }
  }
}
```

#### Generate Answer for a Single Question

For a single question, you can use the same endpoint with just one question in the array, or use the frontend service helper:

```typescript
import { QuestionnaireService } from '../lib/services/questionnaireService';

async function getAnswer() {
  const result = await QuestionnaireService.generateAnswer(
    "Does your company have a data protection policy?"
  );
  
  if (result.success && result.data) {
    console.log(result.data.answer);
  }
}
```

### Frontend Services

The frontend provides a `QuestionnaireService` to interact with the API:

```typescript
// Generate answers for multiple questions
const result = await QuestionnaireService.generateAnswers([
  "How do you handle data breaches?",
  "What is your data retention policy?"
]);

// Generate answer for a single question
const singleResult = await QuestionnaireService.generateAnswer(
  "Does your company comply with GDPR?"
);
```

For examples, see `frontend/lib/examples/questionnaireExample.ts`.

## Vendor Questionnaire System

The Vendor Questionnaire System allows you to:

1. Generate answers to compliance and security questions using AI
2. Save these Q&A results to an existing vendor record or create a new vendor
3. View the questionnaire answers in the vendor detail page

### Using the Vendor Questionnaire Feature

#### Saving Q&A Results to a Vendor

When working with the questionnaire system, you can save the results in two ways:

1. **Existing Vendor**: Select an existing vendor from the dropdown and the answers will be saved to that vendor's record.
2. **New Vendor**: Create a new vendor entry by providing a name, and the system will create a new vendor with the questionnaire answers.

```typescript
// Import the necessary services
import { QuestionnaireService } from './lib/services/questionnaireService';

// Generate answers for questions
const result = await QuestionnaireService.generateAnswers([
  "Does your company have a data protection policy?",
  "How do you handle data breaches?"
]);

// Save to an existing vendor
if (result.success && result.data) {
  const saveResult = await QuestionnaireService.saveQuestionnaireToVendor(
    "vendor-id-123",  // Existing vendor ID
    null,             // No name needed for existing vendor
    result.data.answers
  );
  
  if (saveResult.success) {
    console.log(`Saved to vendor ID: ${saveResult.vendorId}`);
  }
}

// Create a new vendor with the answers
if (result.success && result.data) {
  const saveResult = await QuestionnaireService.saveQuestionnaireToVendor(
    null,                 // No ID for new vendor
    "New Vendor Name",    // Name for the new vendor
    result.data.answers
  );
  
  if (saveResult.success) {
    console.log(`Created new vendor with ID: ${saveResult.vendorId}`);
  }
}
```

#### Viewing Vendor Questionnaire Answers

Questionnaire answers are stored in the vendor's data structure and can be accessed through:

1. The vendor detail page, which displays all questionnaire answers
2. The vendor service API:

```typescript
import { VendorService } from './lib/services/vendorService';

// Get a vendor with their questionnaire answers
const vendor = VendorService.getVendorById("vendor-id-123");

if (vendor) {
  // Access the questionnaire answers
  vendor.questionnaireAnswers.forEach(answer => {
    console.log(`Q: ${answer.question}`);
    console.log(`A: ${answer.answer}`);
  });
}
```

### Vendor Status Updates

When questionnaire answers are saved:

1. For existing vendors, the status is updated to "In Review"
2. For new vendors, they are created with the status "In Review" (since they already have answers)

The system automatically handles these status updates when saving questionnaire results.