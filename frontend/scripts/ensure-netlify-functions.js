/**
 * This script ensures that Netlify functions are properly copied to the .netlify/functions directory
 * It works cross-platform (Windows & Unix) unlike shell commands
 */
const fs = require('fs-extra');
const path = require('path');

// Define paths
const NETLIFY_FUNCTIONS_SRC = path.join(__dirname, '..', 'netlify', 'functions');
const NETLIFY_FUNCTIONS_DEST = path.join(__dirname, '..', '.netlify', 'functions');

// Function to copy files
async function copyFunctions() {
  try {
    console.log('Ensuring Netlify functions directory exists...');
    
    // Ensure destination directory exists
    await fs.ensureDir(NETLIFY_FUNCTIONS_DEST);
    
    console.log('Copying Netlify functions...');
    
    // Check if source directory exists
    if (!fs.existsSync(NETLIFY_FUNCTIONS_SRC)) {
      console.error(`Source directory not found: ${NETLIFY_FUNCTIONS_SRC}`);
      console.log('Creating empty Netlify functions directory...');
      return;
    }
    
    // Get list of files in source directory
    const files = await fs.readdir(NETLIFY_FUNCTIONS_SRC);
    
    // If no files, warn but don't fail
    if (files.length === 0) {
      console.warn('No Netlify functions found to copy');
      return;
    }
    
    // Copy each file
    for (const file of files) {
      const srcPath = path.join(NETLIFY_FUNCTIONS_SRC, file);
      const destPath = path.join(NETLIFY_FUNCTIONS_DEST, file);
      
      await fs.copy(srcPath, destPath, { overwrite: true });
      console.log(`Copied: ${file}`);
    }
    
    console.log('All Netlify functions copied successfully!');
    
    // Create minimal index.js if none exists
    const indexPath = path.join(NETLIFY_FUNCTIONS_DEST, 'index.js');
    if (!fs.existsSync(indexPath)) {
      console.log('Creating default index.js function...');
      await fs.writeFile(
        indexPath,
        `exports.handler = async function() {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Netlify Functions are working!' })
  };
};`
      );
    }
  } catch (error) {
    console.error('Error copying Netlify functions:', error);
    process.exit(1); // Exit with error code
  }
}

// Run the function
copyFunctions().catch(err => {
  console.error('Error in ensure-netlify-functions script:', err);
  process.exit(1);
}); 