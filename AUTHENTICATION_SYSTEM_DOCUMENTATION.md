# Garnet AI Authentication System Documentation

## Overview

Garnet AI implements a comprehensive authentication system with role-based access control, supporting both waitlist signups and full user registration. The system is built with Next.js frontend and Express.js backend, using PostgreSQL for data storage.

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [User Registration (Signup)](#user-registration-signup)
3. [User Login](#user-login)
4. [Role-Based Access Control](#role-based-access-control)
5. [Data Storage](#data-storage)
6. [API Endpoints](#api-endpoints)
7. [Frontend Components](#frontend-components)
8. [Security Features](#security-features)

---

## Authentication Flow

### High-Level Architecture

```
Frontend (Next.js) ↔ Backend API (Express.js) ↔ PostgreSQL Database
                   ↕
              Netlify Functions (Proxy Layer)
```

### Authentication Methods

1. **Direct API Authentication** - Frontend directly calls backend API
2. **Netlify Functions Proxy** - Frontend calls Netlify functions which proxy to Railway backend
3. **Waitlist Signup** - Simple email collection without password
4. **Full Registration** - Complete user account with authentication

---

## User Registration (Signup)

### Signup Types

#### 1. Waitlist Signup (Simple)
- **Endpoint**: `POST /join-waitlist`
- **Required Fields**: `email`, `full_name`
- **Optional Fields**: `role`, `organization`
- **Storage**: `waitlist` table
- **No Password Required**

#### 2. Full User Registration
- **Endpoint**: `POST /api/auth/signup`
- **Required Fields**: `email`, `password`, `full_name`, `role`
- **Optional Fields**: `organization`
- **Storage**: `users` table
- **Password Required** (minimum 8 characters)

### Validation Rules

- **Email**: Must be valid email format (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- **Password**: Minimum 8 characters
- **Role**: Must be either `"vendor"` or `"enterprise"`
- **Full Name**: Required, non-empty string
- **Organization**: Optional string

### Code Implementation

**Frontend Signup Page**: `frontend/app/auth/signup/page.tsx`
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // Validation
  if (!validateForm()) return;
  
  // API Call
  const data = await auth.signup({
    email: formData.email,
    password: formData.password,
    full_name: formData.full_name,
    role: formData.role,
    organization: formData.organization || null,
  });
  
  // Store auth data
  localStorage.setItem("authToken", data.token);
  localStorage.setItem("userData", JSON.stringify(data.user));
  
  // Role-based redirect
  if (data.user.role === "enterprise") {
    router.push("/trust-portal");
  } else {
    router.push("/dashboard");
  }
};
```

---

## User Login

### Login Implementation

**Frontend Login Page**: `frontend/app/auth/login/page.tsx`
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  const data = await auth.login(formData);
  
  localStorage.setItem("authToken", data.token);
  localStorage.setItem("userData", JSON.stringify(data.user));
  
  if (data.user.role === "enterprise") {
    router.push("/trust-portal");
  } else {
    router.push("/dashboard");
  }
};
```

---

## Role-Based Access Control

### User Roles

1. **Vendor** (`"vendor"`)
   - Full access to all platform features
   - Access to dashboard, questionnaires, compliance tools
   - Can manage vendor onboarding processes

2. **Enterprise** (`"enterprise"`)
   - Limited access to Trust Portal only
   - Can view vendor compliance status
   - Cannot access full dashboard features

### Access Control Implementation

**Authentication Context**: `frontend/lib/auth/AuthContext.tsx`
```typescript
const hasAccess = (requiredRole?: string | string[]) => {
  if (!user) return false;
  if (!requiredRole) return true; // Just check if authenticated
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(user.role);
  }
  
  return user.role === requiredRole;
};
```

---

## Data Storage

### Database Schema

#### Users Table (`users`)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- Nullable for waitlist users
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,
  organization VARCHAR(255),
  source VARCHAR(100), -- Signup source tracking
  signup_date TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Waitlist Table (`waitlist`)
```sql
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(100),
  organization VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Data Storage Locations

1. **PostgreSQL Database** (Railway)
   - Connection: `postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway`
   - Primary storage for all user data
   - Handles both `users` and `waitlist` tables

2. **Browser localStorage**
   - `authToken`: JWT token for authentication
   - `userData`: User profile information
   - Cleared on logout

3. **JWT Token Storage**
   - Contains: `{ id, email, role }`
   - Expiry: 7 days
   - Used for API authentication

---

## API Endpoints

### Authentication Endpoints

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| `/api/auth/signup` | POST | Full user registration | None |
| `/api/auth/login` | POST | User login | None |
| `/join-waitlist` | POST | Simple waitlist signup | None |
| `/api/waitlist/signup` | POST | Waitlist with password | None |
| `/api/waitlist/stats` | GET | Waitlist statistics | Admin |
| `/api/waitlist/users` | GET | All waitlist entries | Admin |

### Request/Response Examples

**Signup Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe",
  "role": "vendor",
  "organization": "Acme Corp"
}
```

**Signup Response**:
```json
{
  "message": "Successfully signed up!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "vendor",
    "organization": "Acme Corp",
    "created_at": "2025-01-09T10:30:00Z"
  }
}
```

---

## Security Features

### Password Security
- **Hashing**: bcrypt with 10 salt rounds
- **Minimum Length**: 8 characters
- **Storage**: Only hashed passwords stored, never plaintext

### JWT Security
- **Secret**: Environment variable `JWT_SECRET`
- **Expiry**: 7 days
- **Payload**: Minimal data (id, email, role)
- **Algorithm**: HS256

### Input Validation
- **Email Format**: Regex validation
- **SQL Injection**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CORS**: Configured for specific origins

---

## Environment Configuration

### Required Environment Variables

**Backend**:
```env
DATABASE_URL=postgresql://postgres:password@host:port/database
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=production
PORT=8080
```

**Frontend**:
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

---

## Deployment Architecture

### Current Setup
- **Frontend**: Netlify (with functions)
- **Backend**: Railway (Express.js)
- **Database**: Railway PostgreSQL
- **Authentication**: JWT-based

### Data Flow
1. User interacts with Netlify-hosted frontend
2. Frontend calls Netlify functions (proxy layer)
3. Netlify functions call Railway backend API
4. Backend authenticates and queries PostgreSQL
5. Response flows back through the chain

This architecture provides scalability, security, and separation of concerns while maintaining a smooth user experience across different user roles and access levels. 