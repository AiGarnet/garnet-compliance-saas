/**
 * Netlify deployment script
 * 
 * Prerequisites:
 * 1. Install Netlify CLI: npm install netlify-cli -g
 * 2. Login to Netlify: netlify login
 * 
 * Run with: node scripts/deploy-netlify.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Main deployment function
async function deploy() {
  try {
    console.log('Starting Netlify deployment process...');
    
    // Step 1: Run the cleanup script
    console.log('\n1. Cleaning up unnecessary files...');
    require('./cleanup');
    
    // Step 2: Install dependencies if needed
    console.log('\n2. Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    // Step 3: Build the project
    console.log('\n3. Building the project...');
    execSync('npm run build:netlify', { stdio: 'inherit' });
    
    // Step 4: Deploy to Netlify
    console.log('\n4. Deploying to Netlify...');
    execSync('netlify deploy --prod', { stdio: 'inherit' });
    
    console.log('\nDeployment completed successfully!');
  } catch (error) {
    console.error('\nDeployment failed:', error);
    process.exit(1);
  }
}

// Run the deployment
deploy(); 