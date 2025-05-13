# Deploying to Netlify

This project is configured to deploy only the dashboard from the frontend directory to Netlify.

## How it works

1. The `netlify.toml` configuration sets the base directory to `frontend`
2. Netlify builds the Next.js application using `npm run build`
3. The built files are published from `frontend/.next`
4. The Netlify Next.js plugin handles server-side rendering

## Manual Deployment

To manually deploy to Netlify:

1. Push your changes to your Git repository
2. Log in to Netlify
3. Connect to your Git repository
4. Netlify will automatically deploy your site using the configuration in netlify.toml

## Accessing the site

- The main URL automatically redirects to `/dashboard`
- The dashboard is accessible at `/dashboard` 