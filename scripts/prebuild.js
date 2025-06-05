#!/usr/bin/env node

/**
 * Pre-build script for Garnet AI
 * This script runs before the build process to set up necessary configurations
 */

console.log('🚀 Running pre-build setup...');

// Check if we're in the correct directory
const fs = require('fs');
const path = require('path');

// Ensure frontend directory exists
if (!fs.existsSync('frontend')) {
  console.error('❌ Frontend directory not found. Please run this script from the project root.');
  process.exit(1);
}

// Ensure backend directory exists  
if (!fs.existsSync('backend')) {
  console.error('❌ Backend directory not found. Please run this script from the project root.');
  process.exit(1);
}

console.log('✅ Directory structure verified');

// Create any necessary directories
const requiredDirs = [
  'frontend/.next',
  'frontend/out'
];

requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

console.log('✅ Pre-build setup completed successfully!'); 