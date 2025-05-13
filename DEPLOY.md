# Deploying to Netlify

This project is configured to deploy only the dashboard from the frontend directory to Netlify.

## How it works

1. The `netlify.toml` configuration sets the base directory to `frontend`
2. Next.js is configured for static export with `output: 'export'` in next.config.js
3. Netlify builds the Next.js application using `npm run build`
4. The built files are published from the `out` directory
5. Netlify redirects handle routing:
   - Root URL (`/`) redirects to `/dashboard`
   - `/dashboard` serves the dashboard page
   - All other routes go to the main index.html

## Manual Deployment

To manually deploy to Netlify:

1. Push your changes to your Git repository
2. Log in to Netlify
3. Connect to your Git repository
4. Netlify will automatically deploy your site using the configuration in netlify.toml

## Accessing the site

- The main URL automatically redirects to `/dashboard`
- The dashboard is accessible at `/dashboard` 