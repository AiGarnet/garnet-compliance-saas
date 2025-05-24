# Railway Deployment Guide

## Updated Files for Railway Deployment

1. **Procfile** - Now uses `web: node railway-deploy.js` to start your application
2. **railway.json** - Contains explicit build and deployment commands
3. **nixpacks.toml** - Provides direct instructions to the Nixpacks builder
4. **railway-deploy.js** - Custom startup script that explicitly loads your application
5. **scripts.sh** - Alternative shell script for build and start processes

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
6. Deploy!

## Troubleshooting "No Start Command Found" Error

This error occurs when Railway can't determine how to start your application. We've provided several different ways to specify the start command:

1. **Procfile**: `web: node railway-deploy.js`
2. **package.json**: `"start": "node railway-deploy.js"`
3. **railway.json**: `"startCommand": "node dist/index.js"`
4. **nixpacks.toml**: `cmd = 'node dist/index.js'`
5. **scripts.sh**: Shell script with dedicated start function

With all these options, Railway should be able to detect and use one of them to start your application.

### Important Notes

- Make sure all these files are committed to your repository
- If one approach doesn't work, Railway will try the others
- The custom `railway-deploy.js` script provides extra logging to help diagnose startup issues
- You may need to remove old deployments and start fresh

### Database Connection Issues
Make sure to use the connection details provided by Railway for your PostgreSQL plugin.

### Build Fails
Check if all dependencies are correctly installed and your tsconfig.json is properly configured. 