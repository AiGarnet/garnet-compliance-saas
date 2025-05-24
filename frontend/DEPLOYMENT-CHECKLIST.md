# Netlify Deployment Checklist

Use this checklist to ensure a smooth deployment to Netlify.

## Before Deploying

- [ ] Make sure all code changes are committed and pushed
- [ ] Update environment variables in Netlify UI (not in netlify.toml)
- [ ] Run `npm run lint` to check for any linting errors
- [ ] Test the application locally with `npm run dev`
- [ ] Ensure database connectivity is working locally

## Database Setup

- [ ] Set up a PostgreSQL database service (Heroku, ElephantSQL, etc.)
- [ ] Run the database initialization script: `node scripts/init-db.js`
- [ ] Test database connectivity with: `node scripts/check-users.js`
- [ ] Configure database access credentials in Netlify environment variables

## Netlify Configuration

In the Netlify UI, set the following environment variables:

- [ ] `DB_HOST` - PostgreSQL host
- [ ] `DB_PORT` - PostgreSQL port (usually 5432)
- [ ] `DB_NAME` - PostgreSQL database name
- [ ] `DB_USER` - PostgreSQL username
- [ ] `DB_PASSWORD` - PostgreSQL password
- [ ] `JWT_SECRET` - Secure random string for JWT tokens
- [ ] `NEXT_PUBLIC_API_URL` - Your Netlify site URL (e.g., https://your-site.netlify.app)

## Deployment Steps

1. **Clean up unnecessary files**:
   ```bash
   node scripts/cleanup.js
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the project**:
   ```bash
   npm run build:netlify
   ```

4. **Deploy to Netlify**:
   ```bash
   netlify deploy --prod
   ```

## Post-Deployment Verification

- [ ] Test the signup form on the live site
- [ ] Verify users are being saved in the database
- [ ] Test login functionality
- [ ] Check that JWT tokens are being set correctly
- [ ] Verify protected routes are working as expected

## Troubleshooting Common Issues

- **Database Connection Issues**: Ensure your database allows connections from Netlify's IP ranges.
- **API Route Errors**: Check that your API routes are properly formatted and do not export invalid Route fields.
- **Environment Variable Issues**: Verify all required environment variables are set in the Netlify UI.
- **Build Failures**: Review the Netlify build logs for specific errors.

## Production Database Services

Consider using one of these PostgreSQL services for production:

- [Heroku Postgres](https://www.heroku.com/postgres)
- [Amazon RDS](https://aws.amazon.com/rds/postgresql/)
- [ElephantSQL](https://www.elephantsql.com/)
- [Supabase](https://supabase.com/) 