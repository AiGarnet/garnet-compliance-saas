#!/usr/bin/env node

/**
 * Build merger script for Garnet AI
 * This script merges the Next.js and Vite builds into a single output directory
 */

console.log('🔄 Merging builds...');

const fs = require('fs');
const path = require('path');

// Function to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`⚠️  Source directory ${src} does not exist, skipping...`);
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);

  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Create output directory
const outputDir = 'out';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Copy Next.js build output
const frontendOutDir = 'frontend/out';
if (fs.existsSync(frontendOutDir)) {
  console.log('📁 Copying Next.js build...');
  copyDir(frontendOutDir, outputDir);
  console.log('✅ Next.js build copied');
} else {
  console.log('⚠️  Frontend build output not found, skipping...');
}

// Copy Vite build output if it exists
const viteDistDir = 'dist';
if (fs.existsSync(viteDistDir)) {
  console.log('📁 Copying Vite build...');
  copyDir(viteDistDir, path.join(outputDir, 'vite'));
  console.log('✅ Vite build copied');
} else {
  console.log('⚠️  Vite build output not found, skipping...');
}

console.log('✅ Build merge completed successfully!'); 