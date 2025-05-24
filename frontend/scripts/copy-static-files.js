/**
 * This script copies the static files from the 'out' directory to '.next'
 * It's cross-platform compatible, unlike shell commands
 */
const fs = require('fs-extra');
const path = require('path');

// Define paths
const STATIC_FILES_SRC = path.join(__dirname, '..', 'out');
const STATIC_FILES_DEST = path.join(__dirname, '..', '.next');

// Function to copy files
async function copyFiles() {
  try {
    console.log('Copying static files from out/ to .next/...');
    
    // Check if source directory exists
    if (!fs.existsSync(STATIC_FILES_SRC)) {
      console.error(`Source directory not found: ${STATIC_FILES_SRC}`);
      process.exit(1);
    }
    
    // Ensure destination directory exists
    await fs.ensureDir(STATIC_FILES_DEST);
    
    // Copy all files recursively
    await fs.copy(STATIC_FILES_SRC, STATIC_FILES_DEST, {
      overwrite: true,
      recursive: true
    });
    
    console.log('Static files copied successfully!');
    
    // Copy index.html to root level
    const indexSrc = path.join(STATIC_FILES_SRC, 'index.html');
    const indexDest = path.join(STATIC_FILES_DEST, 'index.html');
    
    if (fs.existsSync(indexSrc)) {
      await fs.copy(indexSrc, indexDest, { overwrite: true });
      console.log('index.html copied to .next/ root');
    } else {
      console.warn('index.html not found in out/ directory');
    }
  } catch (error) {
    console.error('Error copying static files:', error);
    process.exit(1);
  }
}

// Run the function
copyFiles().catch(err => {
  console.error('Error in copy-static-files script:', err);
  process.exit(1);
}); 