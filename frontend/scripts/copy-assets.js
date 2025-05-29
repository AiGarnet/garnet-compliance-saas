/**
 * Script to copy static assets to the export directory
 * This ensures fonts and other important files are included in the Netlify build
 */

const fs = require('fs');
const path = require('path');

// Define source and destination directories
const sourceDir = path.resolve(__dirname, '../public');
const destDir = path.resolve(__dirname, '../out');

/**
 * Copy a directory recursively
 */
function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDir(srcPath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${srcPath} -> ${destPath}`);
    }
  }
}

// Ensure the public/fonts directory exists
const fontsSrc = path.join(sourceDir, 'fonts');
if (!fs.existsSync(fontsSrc)) {
  console.error('Error: public/fonts directory does not exist!');
  process.exit(1);
}

// Copy the fonts directory to the output
const fontsDest = path.join(destDir, 'fonts');
copyDir(fontsSrc, fontsDest);

console.log('✅ Successfully copied font assets to the build output!'); 