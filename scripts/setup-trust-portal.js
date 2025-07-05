const { execSync } = require('child_process');
const path = require('path');

function runCommand(command) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Failed to execute command: ${command}`);
    throw error;
  }
}

async function setup() {
  console.log('Setting up trust portal functionality...');

  // Install required dependencies
  console.log('\n1. Installing dependencies...');
  runCommand('npm install pg node-fetch crypto --save');

  // Run database migration
  console.log('\n2. Running database migration...');
  runCommand('node scripts/apply-migration.js');

  // Run tests
  console.log('\n3. Running tests...');
  runCommand('node scripts/test-trust-portal.js');

  console.log('\nSetup completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Use TrustPortalTokenManager to generate invite tokens for vendors');
  console.log('2. Use EnterpriseFeedbackManager to handle enterprise feedback');
  console.log('3. Monitor the trust portal functionality for any issues');
}

// Run setup
setup().catch(console.error); 