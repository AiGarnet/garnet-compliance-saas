/**
 * Clean up script for deployment
 * 
 * Run with: node scripts/cleanup.js
 */

const fs = require('fs');
const path = require('path');

// Directories to remove
const dirsToRemove = [
  '.storybook',
  'stories',
  'percy-setup.js',
  'accessibility-setup.js',
  'jest.setup.accessibility.js',
  'jest.config.accessibility.js',
  'percy.config.js'
];

// Function to safely remove a directory or file
function removeItem(itemPath) {
  if (!fs.existsSync(itemPath)) {
    console.log(`${itemPath} does not exist. Skipping...`);
    return;
  }

  // Check if it's a directory
  const stats = fs.statSync(itemPath);
  if (stats.isDirectory()) {
    // Remove all files in directory first
    const files = fs.readdirSync(itemPath);
    for (const file of files) {
      const filePath = path.join(itemPath, file);
      removeItem(filePath);
    }
    
    // Remove the directory
    fs.rmdirSync(itemPath);
    console.log(`Removed directory: ${itemPath}`);
  } else {
    // Remove the file
    fs.unlinkSync(itemPath);
    console.log(`Removed file: ${itemPath}`);
  }
}

// Main cleanup function
function cleanup() {
  console.log('Starting cleanup...');
  
  for (const item of dirsToRemove) {
    const itemPath = path.join(__dirname, '..', item);
    try {
      removeItem(itemPath);
    } catch (error) {
      console.error(`Error removing ${itemPath}:`, error);
    }
  }
  
  console.log('Cleanup completed!');
}

// Run the cleanup
cleanup(); 