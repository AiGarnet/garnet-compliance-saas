#!/usr/bin/env node

/**
 * Dependency checker script for Garnet AI
 * This script verifies that all necessary dependencies are installed
 */

console.log('🔍 Checking dependencies...');

const fs = require('fs');
const path = require('path');

// Function to check if package.json and node_modules exist
function checkDependencies(directory, name) {
  const packageJsonPath = path.join(directory, 'package.json');
  const nodeModulesPath = path.join(directory, 'node_modules');

  if (!fs.existsSync(packageJsonPath)) {
    console.error(`❌ ${name}: package.json not found in ${directory}`);
    return false;
  }

  if (!fs.existsSync(nodeModulesPath)) {
    console.error(`❌ ${name}: node_modules not found in ${directory}. Run 'npm install' in ${directory}`);
    return false;
  }

  console.log(`✅ ${name}: Dependencies verified`);
  return true;
}

// Check root dependencies
let allGood = true;
allGood = checkDependencies('.', 'Root') && allGood;

// Check frontend dependencies
if (fs.existsSync('frontend')) {
  allGood = checkDependencies('frontend', 'Frontend') && allGood;
}

// Check backend dependencies  
if (fs.existsSync('backend')) {
  allGood = checkDependencies('backend', 'Backend') && allGood;
}

if (allGood) {
  console.log('✅ All dependencies verified successfully!');
  process.exit(0);
} else {
  console.error('❌ Dependency check failed. Please install missing dependencies.');
  process.exit(1);
} 