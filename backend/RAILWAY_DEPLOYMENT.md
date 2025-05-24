# Railway Deployment Guide

## Latest Updates for Railway Deployment

1. **railway.toml** (NEW) - Railway's recommended configuration format with explicit start command
2. **start.js** (NEW) - Simplified startup script as an alternative entry point
3. **simplified-package.json** (NEW) - Minimal package.json as a fallback option
4. **Procfile** - Uses `web: node railway-deploy.js` to start your application
5. **railway.json** - Contains explicit build and deployment commands
6. **nixpacks.toml** - Provides direct instructions to the Nixpacks builder
7. **railway-deploy.js** - Custom startup script with detailed logging
8. **scripts.sh** - Alternative shell script for build and start processes

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
2. Set the backend directory as the source
3. Make sure to add all the files we created to your repository
4. Add a PostgreSQL plugin from the Railway dashboard
5. Configure the environment variables mentioned above
6. If deployment fails, try renaming `simplified-package.json` to `package.json` and redeploy
7. Deploy!

## Using the Exact Railway Configuration

Railway has provided you with a `railway.toml` configuration that specifies:
- The Nixpacks builder
- V2 runtime
- Configuration for the asia-southeast1 region
- Restart policy settings

We've enhanced this configuration with:
- Build command: `npm install && npm run build`
- Start command: `node railway-deploy.js`
- Health check configuration

## Troubleshooting "No Start Command Found" Error

This error occurs when Railway can't determine how to start your application. We've provided several different ways to specify the start command:

1. **railway.toml** (recommended): `startCommand = "node railway-deploy.js"`
2. **Procfile**: `web: node railway-deploy.js`
3. **package.json**: `"start": "node railway-deploy.js"`
4. **railway.json**: `"startCommand": "node dist/index.js"`
5. **nixpacks.toml**: `cmd = 'node dist/index.js'`
6. **simplified-package.json**: Minimal configuration with just the essentials
7. **scripts.sh**: Shell script with dedicated start function

### Important Notes

- Make sure all these files are committed to your repository
- If one approach doesn't work, Railway will try the others
- The custom `railway-deploy.js` script provides extra logging to help diagnose startup issues
- You may need to remove old deployments and start fresh
- If nothing else works, try renaming `simplified-package.json` to `package.json`

### Database Connection Issues

Make sure to use the connection details provided by Railway for your PostgreSQL plugin.

### Build Fails

Check if all dependencies are correctly installed and your tsconfig.json is properly configured. 