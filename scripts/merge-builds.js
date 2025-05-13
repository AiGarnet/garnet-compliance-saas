import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const nextBuildDir = path.join(rootDir, 'frontend', '.next');
const nextExportDir = path.join(rootDir, 'frontend', 'out');
const viteBuildDir = path.join(rootDir, 'dist');

async function mergeBuilds() {
  try {
    console.log('Starting build merge process...');
    
    // Check if Next.js export directory exists (static export)
    if (fs.existsSync(nextExportDir)) {
      console.log('Copying Next.js static export from "out" to dist...');
      await fs.copy(nextExportDir, path.join(viteBuildDir, 'dashboard'));
    } 
    // Otherwise try to copy from .next if it exists (for client-side rendering)
    else if (fs.existsSync(nextBuildDir)) {
      console.log('Copying Next.js build from ".next" to dist...');
      
      // Create the dashboard directory
      await fs.ensureDir(path.join(viteBuildDir, 'dashboard'));
      
      // Copy static files
      if (fs.existsSync(path.join(nextBuildDir, 'static'))) {
        await fs.copy(
          path.join(nextBuildDir, 'static'), 
          path.join(viteBuildDir, 'dashboard', '_next', 'static')
        );
      }
      
      // Copy public files if they exist
      const nextPublicDir = path.join(rootDir, 'frontend', 'public');
      if (fs.existsSync(nextPublicDir)) {
        await fs.copy(nextPublicDir, path.join(viteBuildDir, 'dashboard'));
      }
    } else {
      console.log('Warning: No Next.js build found. Make sure to run "npm run build:next" first.');
    }
    
    // Create a _redirects file for Netlify to handle SPA routing
    const redirectsContent = `
# Handle routes for the Vite SPA
/* /index.html 200

# Redirect /dashboard to the Next.js app
/dashboard/* /dashboard/index.html 200
`;
    
    await fs.writeFile(path.join(viteBuildDir, '_redirects'), redirectsContent.trim());
    
    console.log('Build merge complete! Files ready for deployment.');
  } catch (error) {
    console.error('Error merging builds:', error);
    process.exit(1);
  }
}

mergeBuilds(); 