# Deploying GARNET to Netlify

This guide covers the process of deploying the GARNET frontend application to Netlify.

## Prerequisites

1. **Netlify Account**: Create a free account at [netlify.com](https://www.netlify.com/)
2. **Netlify CLI**: Install the Netlify CLI globally
   ```bash
   npm install netlify-cli -g
   ```
3. **Authenticate with Netlify**:
   ```bash
   netlify login
   ```

## Deployment Options

### Option 1: Automated Deployment Script

We've created a script that handles the entire deployment process:

```bash
node scripts/deploy-netlify.js
```

This script will:
1. Clean up unnecessary files
2. Install dependencies
3. Build the project
4. Deploy to Netlify

### Option 2: Manual Deployment

If you prefer to deploy manually:

1. **Clean up unnecessary files**:
   ```bash
   node scripts/cleanup.js
   ```

2. **Build the project**:
   ```bash
   npm run build:netlify
   ```

3. **Deploy to Netlify**:
   ```bash
   netlify deploy --prod
   ```

## Environment Variables

For security, configure the following environment variables in the Netlify UI:

- **Database Configuration**:
  - `DB_HOST` - PostgreSQL host
  - `DB_PORT` - PostgreSQL port
  - `DB_NAME` - PostgreSQL database name
  - `DB_USER` - PostgreSQL username
  - `DB_PASSWORD` - PostgreSQL password

- **JWT Configuration**:
  - `JWT_SECRET` - Secret key for JWT tokens

- **API Configuration**:
  - `NEXT_PUBLIC_API_URL` - Your deployed site URL

## Database Considerations

For production, you should use a managed PostgreSQL database service such as:
- [Heroku Postgres](https://www.heroku.com/postgres)
- [Amazon RDS](https://aws.amazon.com/rds/postgresql/)
- [ElephantSQL](https://www.elephantsql.com/)
- [Supabase](https://supabase.com/)

Make sure your database allows connections from Netlify's IP ranges.

## Testing Your Deployment

After deployment, verify that:
1. The signup form works correctly
2. Users are saved to the database
3. Authentication works as expected

## Troubleshooting

- **Database Connection Issues**: Check that your database allows external connections and that your environment variables are correctly set.
- **Build Failures**: Review the Netlify build logs for specific errors.
- **API Errors**: Check the browser console for API request failures. 