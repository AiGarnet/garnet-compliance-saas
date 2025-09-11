# GarnetAI Backend - Developer Guide

Welcome to the GarnetAI Compliance Platform backend! This comprehensive guide will help you understand the entire NestJS backend architecture, modules, APIs, and development workflow.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (specified in Dockerfile and Railway config)
- PostgreSQL database
- npm (for package management)

### Installation & Development
```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run start:dev

# Start with debug mode
npm run start:debug

# Build for production
npm run build

# Start production server
npm run start:prod

# Run tests
npm test

# Run database migrations
npm run migrate
```

## 📁 Project Architecture Overview

This is a **NestJS** backend application using **TypeScript**, **TypeORM**, **PostgreSQL**, and following enterprise-grade patterns.

```
src/
├── 📂 auth/                   # Authentication & Authorization
├── 📂 vendors/                # Vendor Management System
├── 📂 questionnaires/         # Compliance Questionnaire Engine
├── 📂 trust-portal/           # Public Trust Portal API
├── 📂 evidence/               # File Upload & Evidence Management
├── 📂 ai/                     # AI-Powered Compliance Assistant
├── 📂 billing/                # Stripe Payment Integration
├── 📂 analytics/              # Reporting & Analytics
├── 📂 activities/             # Activity Tracking & Auditing
├── 📂 waitlist/               # Waitlist Management
├── 📂 admin/                  # Admin Panel Operations
├── 📂 organizations/          # Multi-tenant Organization Management
├── 📂 checklists/             # Compliance Checklists
├── 📂 documents/              # Document Management
├── 📂 coupons/                # Discount & Coupon System
├── 📂 help/                   # Help & Support System
├── 📂 answer/                 # Questionnaire Answers
├── 📂 generate-answers/       # AI Answer Generation
├── 📂 health/                 # Health Checks & Monitoring
├── 📂 database/               # Database Configuration & Migrations
├── 📂 config/                 # Application Configuration
├── 📂 common/                 # Shared Utilities & Services
├── 📄 app.module.ts           # Root Application Module
├── 📄 main.ts                 # Application Bootstrap
└── 📄 app.controller.ts       # Root Controller
```

## 🏗️ Core Application Modules

### 1. **Authentication Module** (`src/auth/`)
- **Purpose**: User authentication, authorization, and session management
- **Main Files**:
  - `auth.controller.ts` (155 lines) - Authentication endpoints
  - `auth.service.ts` (600 lines) - Authentication business logic
  - `auth.module.ts` - Module configuration
- **Features**:
  - JWT-based authentication
  - User registration and login
  - Password reset functionality
  - Role-based access control (RBAC)
  - Session management
- **Endpoints**:
  - `POST /api/auth/signup` - User registration
  - `POST /api/auth/login` - User login with JWT token
  - `GET /api/auth/profile` - Get authenticated user profile

#### Sub-directories:
- `guards/` - Authentication guards (JWT, Local)
- `strategies/` - Passport strategies (JWT, Local)
- `entities/` - User entity definitions
- `dto/` - Data Transfer Objects for auth operations

### 2. **Vendors Module** (`src/vendors/`)
- **Purpose**: Complete vendor lifecycle and compliance management
- **Main Files**:
  - `vendors.controller.ts` (736 lines) - Vendor management endpoints
  - `vendors.service.ts` (478 lines) - Vendor business logic
  - `vendors.module.ts` - Module configuration
- **Features**:
  - Vendor onboarding and management
  - Compliance status tracking
  - Risk assessment
  - Document management
  - AI-powered vendor suggestions
- **Endpoints**:
  - `GET /api/vendors` - Get all vendors
  - `POST /api/vendors` - Create new vendor
  - `GET /api/vendors/stats` - Vendor statistics
  - `GET /api/vendors/status/:status` - Get vendors by status
  - `GET /api/vendors/with-suggestions` - Get vendors with AI suggestions
  - `GET /api/vendors/:id` - Get specific vendor
  - `PUT /api/vendors/:id` - Update vendor
  - `DELETE /api/vendors/:id` - Delete vendor
  - `POST /api/vendors/with-answers` - Create vendor with questionnaire answers
  - `POST /api/vendors/:id/answers` - Save questionnaire answers

#### Sub-directories:
- `services/` - Additional vendor-related services
- `entities/` - Vendor entity definitions
- `dto/` - Data Transfer Objects for vendor operations

### 3. **Questionnaires Module** (`src/questionnaires/`)
- **Purpose**: Dynamic compliance questionnaire system
- **Main Files**:
  - `questionnaires.controller.ts` (402 lines) - Questionnaire endpoints
  - `questionnaires.service.ts` (799 lines) - Complex questionnaire logic
  - `questionnaires.module.ts` - Module configuration
- **Features**:
  - Dynamic questionnaire generation
  - SOC 2, ISO 27001, PCI DSS compliance frameworks
  - Progress tracking
  - Evidence attachment
  - Conditional logic and branching
- **Endpoints**:
  - `POST /api/questionnaires` - Create questionnaire
  - `GET /api/questionnaires` - Get all questionnaires
  - `GET /api/questionnaires/:id` - Get specific questionnaire
  - `PUT /api/questionnaires/:id` - Update questionnaire
  - `DELETE /api/questionnaires/:id` - Delete questionnaire
  - `GET /api/questionnaires/:id/questions` - Get questionnaire questions

#### Sub-directories:
- `entities/` - Questionnaire entity definitions
- `dto/` - Data Transfer Objects for questionnaire operations

### 4. **AI Module** (`src/ai/`)
- **Purpose**: AI-powered compliance assistance and automation
- **Main Files**:
  - `ai.controller.ts` (204 lines) - AI assistance endpoints
  - `ai.service.ts` (1,720 lines) - Comprehensive AI logic
  - `ai.module.ts` - Module configuration
- **Features**:
  - OpenAI GPT-4 integration
  - Intelligent questionnaire assistance
  - Compliance gap analysis
  - Automated answer generation
  - Risk assessment insights
  - Natural language processing for compliance documents

#### Sub-directories:
- `services/` - Specialized AI services
- `entities/` - AI-related entity definitions
- `dto/` - Data Transfer Objects for AI operations

### 5. **Trust Portal Module** (`src/trust-portal/`)
- **Purpose**: Public-facing compliance documentation portal
- **Main Files**:
  - `trust-portal.controller.ts` (698 lines) - Public portal endpoints
  - `trust-portal.service.ts` (1,203 lines) - Portal business logic
  - `trust-portal.module.ts` - Module configuration
- **Features**:
  - Public compliance documentation
  - Vendor portal access
  - Compliance certificate sharing
  - Security questionnaire responses
  - Audit trail visibility

#### Sub-directories:
- `entities/` - Trust portal entity definitions
- `dto/` - Data Transfer Objects for portal operations

### 6. **Evidence Module** (`src/evidence/`)
- **Purpose**: File upload and evidence management system
- **Main Files**:
  - `evidence.controller.ts` (234 lines) - File upload endpoints
  - `evidence.service.ts` (247 lines) - File management logic
  - `evidence.module.ts` - Module configuration
- **Features**:
  - Secure file upload (PDF, DOC, images)
  - DigitalOcean Spaces integration
  - Evidence categorization
  - File validation and processing
  - Metadata extraction

#### Sub-directories:
- `entities/` - Evidence entity definitions
- `dto/` - Data Transfer Objects for evidence operations

### 7. **Billing Module** (`src/billing/`)
- **Purpose**: Stripe payment integration and subscription management
- **Main Files**:
  - `billing.controller.ts` (190 lines) - Payment endpoints
  - `billing.service.ts` (794 lines) - Payment processing logic
  - `feature-access.service.ts` (704 lines) - Feature access control
  - `stripe-coupons.service.ts` (82 lines) - Coupon management
  - `billing.module.ts` - Module configuration
- **Features**:
  - Stripe subscription management
  - Payment processing
  - Feature-based access control
  - Billing analytics
  - Coupon and discount management
  - Usage tracking and billing

### 8. **Analytics Module** (`src/analytics/`)
- **Purpose**: Reporting, metrics, and business intelligence
- **Main Files**:
  - `analytics.controller.ts` (177 lines) - Analytics endpoints
  - `analytics.service.ts` (294 lines) - Analytics processing
  - `analytics.module.ts` - Module configuration
- **Features**:
  - Compliance metrics
  - Vendor performance analytics
  - User engagement tracking
  - Security posture reporting
  - Custom dashboard data

#### Sub-directories:
- `entities/` - Analytics entity definitions
- `dto/` - Data Transfer Objects for analytics operations

### 9. **Activities Module** (`src/activities/`)
- **Purpose**: Audit trail and activity tracking
- **Features**:
  - User action logging
  - Compliance audit trails
  - Change tracking
  - Security event monitoring

### 10. **Admin Module** (`src/admin/`)
- **Purpose**: Administrative functions and system management
- **Features**:
  - User management
  - System configuration
  - Compliance framework management
  - Audit tools

### 11. **Organizations Module** (`src/organizations/`)
- **Purpose**: Multi-tenant organization management
- **Features**:
  - Organization creation and management
  - Team member management
  - Role assignments
  - Multi-tenant data isolation

### 12. **Waitlist Module** (`src/waitlist/`)
- **Purpose**: Pre-launch and beta user management
- **Features**:
  - Waitlist signup
  - Email notifications
  - Beta user onboarding
  - Analytics tracking

## 🔧 Configuration & Infrastructure

### **Configuration System** (`src/config/`)

#### `configuration.ts` - Central Configuration
```typescript
export const configuration = () => ({
  port: 8080,                    // Application port
  nodeEnv: 'production',         // Environment
  
  database: {                    // PostgreSQL configuration
    url: 'postgresql://...',     // Railway PostgreSQL
    ssl: { rejectUnauthorized: false }
  },
  
  jwt: {                         // JWT authentication
    secret: 'garnet-ai-super-secret-jwt-key-2025-production',
    expiresIn: '24h'
  },
  
  openai: {                      // OpenAI integration
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
    maxTokens: 1000
  },
  
  upload: {                      // File upload limits
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['application/pdf', ...]
  },
  
  digitalOceanSpaces: {          // File storage
    accessKeyId: process.env.DO_SPACE_ACCESS_KEY,
    bucket: 'vendor-onboarding'
  }
})
```

#### `pricing.ts` - Subscription Tiers (167 lines)
- Detailed pricing configuration
- Feature access definitions
- Billing cycle management

### **Database System** (`src/database/`)

#### `database.module.ts` - TypeORM Configuration
- PostgreSQL connection management
- Entity registration
- Migration configuration
- Connection pooling

#### `database.service.ts` - Database utilities
- Custom database operations
- Health checks
- Connection monitoring

#### `migrations/` - Database Migrations
- Schema versioning
- Data migration scripts
- Rollback capabilities

### **Common Utilities** (`src/common/`)

#### Core Services:
- `email.service.ts` (68 lines) - Email notifications
- `interceptors/` - HTTP interceptors
- `decorators/` - Custom decorators
- `services/` - Shared business services
- `filters/` - Exception filters

#### Key Features:
- `filters/http-exception.filter.ts` - Global error handling
- `interceptors/logging.interceptor.ts` - Request/response logging
- Rate limiting and throttling
- CORS configuration
- Security middleware

## 🌐 API Endpoints Overview

### **Total API Surface**: 56+ endpoints across 8 core modules

#### **Authentication Endpoints** (3 endpoints)
```
POST /api/auth/signup          # User registration
POST /api/auth/login           # User login with JWT
GET  /api/auth/profile         # Get user profile
```

#### **Vendor Management** (10 endpoints)
```
GET    /api/vendors                    # List all vendors
POST   /api/vendors                    # Create vendor
GET    /api/vendors/stats              # Vendor statistics
GET    /api/vendors/status/:status     # Filter by status
GET    /api/vendors/with-suggestions   # AI-enhanced vendor list
GET    /api/vendors/:id                # Get vendor details
PUT    /api/vendors/:id                # Update vendor
DELETE /api/vendors/:id                # Delete vendor
POST   /api/vendors/with-answers       # Create with questionnaire
POST   /api/vendors/:id/answers        # Save answers
```

#### **Questionnaire System** (7 endpoints)
```
POST   /api/questionnaires             # Create questionnaire
GET    /api/questionnaires             # List questionnaires
GET    /api/questionnaires/:id         # Get questionnaire
PUT    /api/questionnaires/:id         # Update questionnaire
DELETE /api/questionnaires/:id         # Delete questionnaire
GET    /api/questionnaires/:id/questions # Get questions
```

#### **AI & Chatbot** (5+ endpoints)
- AI-powered compliance assistance
- Automated answer generation
- Risk assessment insights
- Natural language query processing

#### **Trust Portal** (8+ endpoints)
- Public compliance documentation
- Vendor portal interfaces
- Security questionnaire responses
- Compliance certificate sharing

#### **Billing & Subscriptions** (6+ endpoints)
- Stripe payment processing
- Subscription management
- Feature access control
- Usage tracking

#### **Evidence Management** (4+ endpoints)
- File upload and processing
- Evidence categorization
- Metadata extraction
- Secure file storage

#### **Analytics & Reporting** (6+ endpoints)
- Compliance metrics
- Performance analytics
- Custom dashboard data
- Security posture reports

#### **Waitlist Management** (4 endpoints)
```
POST /join-waitlist              # Public signup (no auth)
POST /api/waitlist/signup        # Authenticated signup
GET  /api/waitlist/stats         # Waitlist statistics
GET  /api/waitlist/users         # Get waitlist users
```

## 🔐 Security & Authentication

### **Authentication Strategy**
- **JWT-based authentication** with configurable expiration
- **Passport.js integration** for multiple auth strategies
- **Role-based access control (RBAC)**
- **API route protection** with guards

### **Security Features**
- **Helmet.js** for security headers
- **Rate limiting** (100 requests/minute)
- **CORS configuration** for allowed origins
- **Input validation** with class-validator
- **SQL injection prevention** with TypeORM
- **File upload validation** with type checking

### **Environment Security**
```bash
# Critical Environment Variables
JWT_SECRET=your-super-secret-jwt-key
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
DO_SPACE_ACCESS_KEY=...
DO_SPACE_SECRET_KEY=...
```

## 🚀 Deployment & Infrastructure

### **Railway Deployment** (`railway.toml`)
```toml
[build]
builder = "DOCKERFILE"
buildTimeout = 900          # 15 minutes for npm install

[deploy]
runtime = "V2"
numReplicas = 1
memoryLimit = 1024          # 1GB RAM
cpuLimit = 1000             # 1 CPU core
startCommand = "dumb-init node dist/main.js"

[healthcheck]
path = "/health"
timeout = 15
interval = 30
initialDelaySeconds = 60    # Startup grace period
```

### **Docker Configuration** (`Dockerfile`)
- **Multi-stage build** for optimization
- **Node.js 18 Alpine** base image
- **Non-root user** for security
- **Health checks** for monitoring
- **Signal handling** with dumb-init
- **Optimized npm configuration**

### **Production Optimization**
- **Bundle size optimization**
- **Memory management** (512MB heap limit)
- **CPU optimization flags**
- **Gzip compression**
- **Static asset serving**

## 🧪 Testing & Quality

### **Testing Framework**
- **Jest** for unit testing
- **Supertest** for integration testing
- **Test coverage** reporting
- **E2E testing** configuration

### **Code Quality**
- **ESLint** with TypeScript rules
- **Prettier** for code formatting
- **TypeScript strict mode**
- **Automated code review**

### **Available Scripts**
| Script | Purpose |
|--------|---------|
| `npm run start:dev` | Development server with auto-reload |
| `npm run start:debug` | Debug mode with inspector |
| `npm run build` | Production build |
| `npm run start:prod` | Production server |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Watch mode testing |
| `npm run test:cov` | Coverage reporting |
| `npm run test:e2e` | End-to-end tests |
| `npm run lint` | ESLint code checking |
| `npm run format` | Prettier code formatting |
| `npm run migrate` | Run database migrations |
| `npm run migrate:rollback` | Rollback migrations |

## 📊 Database Architecture

### **PostgreSQL on Railway**
- **Managed PostgreSQL** database
- **Connection pooling** for performance
- **SSL encryption** in production
- **Automated backups**

### **TypeORM Integration**
- **Entity-based modeling**
- **Migration system**
- **Query builder**
- **Relationship management**

### **Key Entities**
- `User` - Authentication and user management
- `Vendor` - Vendor information and compliance status
- `Questionnaire` - Compliance questionnaire definitions
- `Answer` - Questionnaire responses
- `Evidence` - File uploads and evidence
- `Organization` - Multi-tenant organizations
- `Activity` - Audit trail and logging

## 🔄 Data Flow & Business Logic

### **Request Lifecycle**
1. **HTTP Request** → Middleware (CORS, Security, Rate Limiting)
2. **Authentication** → JWT validation and user context
3. **Authorization** → Role-based access control
4. **Validation** → Input validation with DTOs
5. **Controller** → Route handling and request parsing
6. **Service** → Business logic processing
7. **Repository** → Database operations
8. **Response** → JSON response with proper status codes

### **AI Integration Flow**
1. **User Input** → Questionnaire or compliance query
2. **Context Building** → Gather relevant compliance data
3. **OpenAI Processing** → GPT-4 analysis and generation
4. **Response Formatting** → Structure AI output
5. **Storage** → Cache results and track usage

### **File Upload Flow**
1. **File Validation** → Size, type, and security checks
2. **Processing** → Metadata extraction and analysis
3. **Storage** → DigitalOcean Spaces upload
4. **Database** → File metadata and relationships
5. **CDN** → Optimized file delivery

## 🐛 Development Guidelines

### **Getting Started for New Developers**

1. **Environment Setup**:
   ```bash
   # Clone repository
   git clone [repository]
   cd [project-root]
   
   # Install dependencies
   npm install
   
   # Set up environment variables
   cp .env.example .env
   # Fill in your environment variables
   
   # Start development server
   npm run start:dev
   ```

2. **Understanding the Architecture**:
   - Start with `src/main.ts` - application bootstrap
   - Review `src/app.module.ts` - module organization
   - Explore individual modules starting with `auth/` and `vendors/`
   - Understand the database models in `entities/` directories

3. **Development Workflow**:
   - **Feature Development**: Create new modules following NestJS patterns
   - **API Design**: Use DTOs for input validation
   - **Database Changes**: Create and run migrations
   - **Testing**: Write tests for new functionality
   - **Documentation**: Update API documentation

### **Code Organization Principles**
- **Modular Architecture**: Each domain has its own module
- **Separation of Concerns**: Controllers, Services, and Repositories
- **Dependency Injection**: NestJS IoC container
- **TypeScript First**: Full type safety
- **Clean Code**: SOLID principles and design patterns

### **Adding New Features**

1. **Create Module**:
   ```bash
   nest generate module feature-name
   nest generate controller feature-name
   nest generate service feature-name
   ```

2. **Define Entities**: Create TypeORM entities in `entities/`
3. **Create DTOs**: Input validation objects in `dto/`
4. **Implement Logic**: Business logic in services
5. **Add Tests**: Unit and integration tests
6. **Update Documentation**: API docs and README

### **Database Development**
- **Migrations**: Use TypeORM migrations for schema changes
- **Entities**: Define database models with TypeORM decorators
- **Relationships**: Use TypeORM relationships for data integrity
- **Queries**: Use QueryBuilder for complex queries

## 📚 API Documentation

### **Swagger/OpenAPI**
- **Live Documentation**: Available at `/api/docs`
- **Interactive Testing**: Test endpoints directly
- **Schema Definitions**: Automatic DTO documentation
- **Authentication**: Bearer token testing

### **API Tags**
- `Authentication` - User auth and authorization
- `Vendors` - Vendor management operations
- `Questionnaires` - Compliance questionnaire system
- `Evidence` - File upload and management
- `Trust Portal` - Public compliance portal
- `Waitlist` - Waitlist management
- `AI & Chatbot` - AI-powered assistance
- `Analytics` - Reporting and metrics
- `Health` - System monitoring

## 🔍 Monitoring & Health Checks

### **Health Check System** (`src/health/`)
- **Database Connectivity**: PostgreSQL connection status
- **External Services**: OpenAI, DigitalOcean Spaces
- **Memory Usage**: Application memory monitoring
- **Disk Space**: Available storage checks
- **API Endpoint**: `GET /health`

### **Logging System**
- **Structured Logging**: JSON format for production
- **Request Logging**: HTTP request/response tracking
- **Error Tracking**: Exception monitoring
- **Performance Metrics**: Response time tracking

## 🤝 Contributing & Best Practices

### **Development Standards**
1. **Follow NestJS Conventions**: Use decorators, modules, and dependency injection
2. **TypeScript Strict Mode**: Maintain full type safety
3. **API Design**: RESTful endpoints with proper HTTP methods
4. **Error Handling**: Consistent error responses
5. **Security First**: Validate all inputs and secure endpoints
6. **Documentation**: Keep API docs updated
7. **Testing**: Maintain test coverage
8. **Performance**: Optimize database queries and API responses

### **Git Workflow**
- Feature branches for new development
- Code reviews before merging
- Automated testing on pull requests
- Production deployments via Railway

## 📞 Support & Resources

- **Swagger Documentation**: `/api/docs`
- **Health Monitoring**: `/health`
- **NestJS Framework**: Enterprise-grade Node.js framework
- **TypeORM**: Database ORM with migration support
- **PostgreSQL**: Production-ready database
- **Railway Platform**: Cloud deployment and hosting

---

This backend serves as the complete API foundation for the GarnetAI Compliance Platform, providing robust authentication, comprehensive vendor management, AI-powered compliance assistance, and enterprise-grade security features. The modular architecture ensures maintainability and scalability as the platform grows.