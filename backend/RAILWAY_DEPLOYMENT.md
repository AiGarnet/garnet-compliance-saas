# Railway Deployment Guide

## Files Added for Railway Deployment

1. **Procfile** - Tells Railway how to start your application
2. **railway.json** - Railway configuration file with build and start commands

## Setting Up Environment Variables

In Railway's dashboard, add these environment variables:

```
PORT=5000
NODE_ENV=production
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=garnet_ai
DB_USER=your_db_user
DB_PASSWORD=your_db_password
OPENAI_API_KEY=your_openai_key
```

## Deployment Steps

1. Link your GitHub repository to Railway
2. Select the backend directory as the source
3. Add a PostgreSQL plugin from the Railway dashboard
4. Configure the environment variables mentioned above
5. Deploy!

## Troubleshooting

### No Start Command Found
If you see "No start command could be found", make sure:
- The `Procfile` is in the root of your deployment directory
- Your `package.json` has a valid "start" script: `"start": "node dist/index.js"`
- The `railway.json` file is correctly configured

### Database Connection Issues
Make sure to use the connection details provided by Railway for your PostgreSQL plugin.

### Build Fails
Check if all dependencies are correctly installed and your tsconfig.json is properly configured. 