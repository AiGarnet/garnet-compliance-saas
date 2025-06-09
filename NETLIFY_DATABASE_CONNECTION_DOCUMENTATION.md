# Netlify-to-Database Connection Documentation

## Overview

Garnet AI implements a sophisticated three-tier architecture where Netlify functions serve as a proxy layer between the frontend and the Railway backend, which then connects to the PostgreSQL database. This setup provides redundancy, security, and deployment flexibility.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │    │                 │
│   Frontend      │    │  Netlify        │    │   Railway       │    │  PostgreSQL     │
│   (Next.js)     │◄──►│  Functions      │◄──►│   Backend       │◄──►│  Database       │
│                 │    │  (Proxy Layer)  │    │   (Express.js)  │    │                 │
│                 │    │                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Connection Methods

### 1. **Dual-Path Architecture**

Garnet AI supports TWO connection methods for maximum reliability:

#### **Path A: Direct API Connection**
```
Frontend → Railway Backend API → PostgreSQL Database
```

#### **Path B: Netlify Functions Proxy**
```
Frontend → Netlify Functions → Railway Backend API → PostgreSQL Database
```

### 2. **Hybrid Database Access**

Some Netlify functions connect DIRECTLY to the database while others proxy through the Railway backend:

#### **Direct Database Connection** (Some Functions)
```
Frontend → Netlify Functions → PostgreSQL Database (Direct)
```

#### **Proxy Through Backend** (Most Functions)
```
Frontend → Netlify Functions → Railway Backend → PostgreSQL Database
```

---

## Netlify Functions Overview

### Function Structure

All Netlify functions are located in `frontend/.netlify/functions/` and follow this pattern:

```javascript
// Standard Netlify function structure
const handler = async (event, context) => {
  // 1. CORS handling
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // 2. Method validation
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // 3. Request processing
  try {
    // Parse request
    const requestData = JSON.parse(event.body);
    
    // Forward to Railway backend
    const railwayResponse = await fetch(RAILWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    
    // Return response
    const data = await railwayResponse.json();
    return {
      statusCode: railwayResponse.status,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
```

---

## Database Connection Methods

### Method 1: Railway Backend Proxy (Recommended)

**Used by**: `auth-login.js`, `auth-signup.js`, `waitlist-signup.js`

**Flow**:
1. Netlify function receives request from frontend
2. Function forwards request to Railway backend API
3. Railway backend processes request and queries database
4. Response flows back through the chain

**Example**: `waitlist-signup.js`
```javascript
// Railway backend URL
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 
  'https://garnet-compliance-saas-production.up.railway.app';

// Forward to Railway backend
const railwayResponse = await fetch(`${BACKEND_URL}/join-waitlist`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Netlify-Function/1.0',
  },
  body: JSON.stringify({
    email: requestData.email,
    full_name: requestData.full_name,
    role: requestData.role || null,
    organization: requestData.organization || null,
  }),
});
```

### Method 2: Direct Database Connection

**Used by**: `api.js`, `init-db.js`

**Flow**:
1. Netlify function connects directly to PostgreSQL
2. Function executes database queries
3. Response sent directly to frontend

**Example**: `api.js`
```javascript
// Direct database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Direct database query
async function executeQuery(text, params = []) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

// User operations
const userDb = {
  async findUserByEmail(email) {
    const result = await executeQuery(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  },

  async createUser(userData) {
    const result = await executeQuery(
      `INSERT INTO users (id, email, password_hash, full_name, role, organization)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, full_name, role, organization, created_at, updated_at`,
      [id, email.toLowerCase(), password_hash, full_name, role, organization]
    );
    return result.rows[0];
  }
};
```

---

## Netlify Functions Breakdown

### 1. **Authentication Functions**

#### `auth-login.js`
- **Purpose**: User authentication via Railway backend
- **Method**: Proxy to Railway
- **Endpoint**: `/.netlify/functions/auth-login`
- **Backend URL**: `https://garnet-compliance-saas-production.up.railway.app/api/auth/login`

```javascript
// Proxy login request to Railway
const railwayResponse = await fetch(
  'https://garnet-compliance-saas-production.up.railway.app/api/auth/login',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }
);
```

#### `auth-signup.js`
- **Purpose**: User registration via Railway backend
- **Method**: Proxy to Railway
- **Endpoint**: `/.netlify/functions/auth-signup`
- **Backend URL**: `https://garnet-compliance-saas-production.up.railway.app/api/auth/signup`

### 2. **Waitlist Functions**

#### `waitlist-signup.js`
- **Purpose**: Waitlist registration via Railway backend
- **Method**: Proxy to Railway
- **Endpoint**: `/.netlify/functions/waitlist-signup`
- **Backend URL**: `https://garnet-compliance-saas-production.up.railway.app/join-waitlist`

```javascript
// Comprehensive error handling and Railway forwarding
const railwayResponse = await fetch(waitlistEndpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Netlify-Function/1.0',
  },
  body: JSON.stringify({
    email: requestData.email,
    full_name: requestData.full_name,
    role: requestData.role || null,
    organization: requestData.organization || null,
  }),
});
```

### 3. **Database Management Functions**

#### `api.js`
- **Purpose**: General API handling with direct database access
- **Method**: Direct database connection
- **Features**: User CRUD operations, JWT token generation

#### `init-db.js`
- **Purpose**: Database initialization and management
- **Method**: Direct database connection
- **Features**: Schema creation, data migration

### 4. **Utility Functions**

#### `health.js`
- **Purpose**: System health monitoring
- **Method**: Railway backend health check

#### `test-backend.js`
- **Purpose**: Backend connectivity testing
- **Method**: Railway backend connectivity test

---

## Database Configuration

### Railway PostgreSQL Connection

**Connection String**:
```
postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway
```

### Environment Variables

#### **Railway Backend** (`backend/src/config/database.ts`)
```typescript
const connectionString = process.env.DATABASE_URL || 
  'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway';

const dbConfig = {
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

const pool = new Pool(dbConfig);
```

#### **Netlify Functions**
```javascript
// Direct database connection in Netlify functions
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
```

#### **Required Environment Variables**
- **`DATABASE_URL`**: PostgreSQL connection string
- **`NEXT_PUBLIC_API_URL`**: Railway backend URL (optional override)
- **`JWT_SECRET`**: JWT signing secret
- **`NODE_ENV`**: Environment setting

---

## Security & Configuration

### CORS Configuration

All Netlify functions implement CORS headers for cross-origin requests:

```javascript
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};
```

### SSL Configuration

Both Railway backend and Netlify functions use SSL for database connections:

```javascript
ssl: {
  rejectUnauthorized: false  // Required for Railway PostgreSQL
}
```

### Error Handling

Comprehensive error handling at each layer:

1. **Netlify Function Level**: Request validation, parsing errors
2. **Railway Backend Level**: Business logic errors, database errors
3. **Database Level**: Connection errors, constraint violations

---

## Data Flow Examples

### Example 1: User Signup via Netlify Function

```
1. Frontend submits signup form
   ↓
2. POST /.netlify/functions/auth-signup
   ↓
3. Netlify function validates input
   ↓
4. Forward to Railway: POST /api/auth/signup
   ↓
5. Railway backend validates & hashes password
   ↓
6. Railway backend inserts into PostgreSQL users table
   ↓
7. Railway backend generates JWT token
   ↓
8. Response flows back: Railway → Netlify → Frontend
```

### Example 2: Waitlist Signup via Direct Database

```
1. Frontend submits waitlist form
   ↓
2. POST /.netlify/functions/api (signup handler)
   ↓
3. Netlify function connects directly to PostgreSQL
   ↓
4. Direct INSERT into users table
   ↓
5. Generate JWT token in Netlify function
   ↓
6. Response sent directly to frontend
```

### Example 3: User Login via Railway Proxy

```
1. Frontend submits login credentials
   ↓
2. POST /.netlify/functions/auth-login
   ↓
3. Netlify function forwards to Railway: POST /api/auth/login
   ↓
4. Railway backend validates credentials against PostgreSQL
   ↓
5. Railway backend generates JWT token
   ↓
6. Response flows back: Railway → Netlify → Frontend
```

---

## Advantages of This Architecture

### 1. **Redundancy**
- Multiple connection paths ensure high availability
- If Railway backend fails, some functions can still work via direct database access

### 2. **Scalability**
- Netlify Functions auto-scale based on demand
- Railway backend can scale independently
- Database connection pooling prevents connection exhaustion

### 3. **Security**
- Netlify Functions act as a security layer
- Database credentials not exposed to frontend
- CORS protection at function level

### 4. **Flexibility**
- Can easily switch between direct and proxy connections
- Environment-specific configurations
- Easy to add new endpoints or modify existing ones

### 5. **Monitoring**
- Separate logging at each layer
- Railway provides backend monitoring
- Netlify provides function execution logs

---

## Development & Testing

### Local Development

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run functions locally
netlify dev

# Functions available at:
# http://localhost:8888/.netlify/functions/[function-name]
```

### Testing Individual Functions

```bash
# Test waitlist signup
curl -X POST http://localhost:8888/.netlify/functions/waitlist-signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","full_name":"Test User"}'

# Test auth login
curl -X POST http://localhost:8888/.netlify/functions/auth-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Production URLs

- **Netlify Functions**: `https://testinggarnet.netlify.app/.netlify/functions/[function-name]`
- **Railway Backend**: `https://garnet-compliance-saas-production.up.railway.app`
- **Database**: `shortline.proxy.rlwy.net:28381`

---

## Troubleshooting

### Common Issues

1. **Database Connection Timeouts**
   - Check if Railway database is accessible
   - Verify SSL configuration
   - Check connection pool settings

2. **CORS Errors**
   - Verify CORS headers in function responses
   - Check allowed origins configuration

3. **Function Timeouts**
   - Netlify functions have 10-second timeout limit
   - Optimize database queries for performance

4. **Environment Variable Issues**
   - Ensure `DATABASE_URL` is set in Netlify environment
   - Verify Railway backend URL is correct

### Monitoring

- **Netlify Function Logs**: Available in Netlify dashboard
- **Railway Backend Logs**: Available in Railway dashboard
- **Database Monitoring**: Through Railway PostgreSQL dashboard

This architecture provides a robust, scalable, and secure connection between the Netlify-hosted frontend and the Railway PostgreSQL database, with multiple fallback options and comprehensive error handling. 