# Deploying to Netlify with PostgreSQL

This guide explains how to deploy the application to Netlify with PostgreSQL database integration for the waitlist feature.

## Prerequisites

1. A Netlify account
2. A PostgreSQL database (either self-hosted or a cloud service like Heroku Postgres, AWS RDS, etc.)

## Setup Steps

### 1. Set up PostgreSQL

First, make sure you have a PostgreSQL database ready. You can use:
- [Heroku Postgres](https://www.heroku.com/postgres) (easy setup, free tier available)
- [Supabase](https://supabase.com/) (PostgreSQL with more features)
- [AWS RDS](https://aws.amazon.com/rds/postgresql/)
- [DigitalOcean Managed Databases](https://www.digitalocean.com/products/managed-databases)

Make note of your database connection string, which should look like:
```
postgres://username:password@hostname:port/database_name
```

### 2. Deploy to Netlify

1. Log in to your Netlify account
2. Click "Add new site" → "Import an existing project"
3. Connect to your Git provider and select your repository
4. Configure the build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Click "Show advanced" and add the following environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NETLIFY`: `true`
   - `NODE_ENV`: `production`
6. Click "Deploy site"

### 3. Verify Database Setup

After deployment, check the Netlify deployment logs to verify that:
1. The database connection was established
2. The `users` table was created (if it didn't exist)

You can also trigger a manual run of the database setup function by visiting:
```
https://your-netlify-site.netlify.app/.netlify/functions/setup-db
```

### 4. Test the Waitlist Form

Visit your deployed site and test the waitlist form. When users submit the form:
1. Their information will be stored directly in the PostgreSQL database
2. Password hashing is handled securely
3. Duplicate email submissions are prevented

## Troubleshooting

### Database Connection Issues

If you're experiencing database connection issues:

1. Check your `DATABASE_URL` in Netlify environment variables
2. Make sure your database accepts connections from Netlify's IP range
3. Check if SSL is required by your database provider

For Heroku Postgres, make sure the connection URL includes `?sslmode=require`.

### Table Creation Issues

If the table isn't being created:

1. Check if your database user has permission to create tables
2. Manually run the SQL script from the database setup function

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  organization TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

## Managing Users

To manage users in your PostgreSQL database, you can:

1. Use a PostgreSQL client like pgAdmin or DBeaver
2. Connect to your database using the connection string
3. Query the `users` table to view, update, or delete entries

Example queries:

```sql
-- View all users
SELECT * FROM users ORDER BY created_at DESC;

-- Count users
SELECT COUNT(*) FROM users;

-- Find user by email
SELECT * FROM users WHERE email = 'example@email.com';
```

## Technical Implementation Details

The waitlist form is integrated with PostgreSQL through:

1. A Netlify serverless function (`waitlist-signup.js`) that handles form submissions
2. A database setup function (`setup-db.js`) that creates the necessary table on deployment
3. Direct integration with the Next.js API route when running in development mode

The application is configured to automatically fall back to a JSON file storage if the database connection fails, ensuring the waitlist functionality always works even if there are temporary database issues. 