/**
 * This script verifies that the Netlify configuration is correct
 * Run this before deploying to Netlify
 */
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// Define paths to check
const NETLIFY_TOML = path.join(__dirname, '..', 'netlify.toml');
const NETLIFY_FUNCTIONS_DIR = path.join(__dirname, '..', '.netlify', 'functions');
const NEXT_CONFIG = path.join(__dirname, '..', 'next.config.js');

console.log(chalk.blue('Verifying Netlify deployment configuration...'));

// Check if netlify.toml exists
if (!fs.existsSync(NETLIFY_TOML)) {
  console.error(chalk.red('❌ netlify.toml not found!'));
  process.exit(1);
} else {
  console.log(chalk.green('✅ netlify.toml found'));
}

// Check for functions directory
if (!fs.existsSync(NETLIFY_FUNCTIONS_DIR)) {
  console.warn(chalk.yellow('⚠️ .netlify/functions directory not found, creating it...'));
  try {
    fs.ensureDirSync(NETLIFY_FUNCTIONS_DIR);
    console.log(chalk.green('✅ Created .netlify/functions directory'));
  } catch (error) {
    console.error(chalk.red(`❌ Failed to create .netlify/functions: ${error.message}`));
  }
} else {
  console.log(chalk.green('✅ .netlify/functions directory exists'));
  
  // Check if there are functions in the directory
  const functionFiles = fs.readdirSync(NETLIFY_FUNCTIONS_DIR);
  if (functionFiles.length === 0) {
    console.warn(chalk.yellow('⚠️ No function files found in .netlify/functions'));
    console.log(chalk.blue('   Running ensure-netlify-functions script...'));
    try {
      require('./ensure-netlify-functions');
    } catch (error) {
      console.error(chalk.red(`❌ Failed to run ensure-netlify-functions: ${error.message}`));
    }
  } else {
    console.log(chalk.green(`✅ Found ${functionFiles.length} function files`));
  }
}

// Check next.config.js
if (!fs.existsSync(NEXT_CONFIG)) {
  console.error(chalk.red('❌ next.config.js not found!'));
  process.exit(1);
} else {
  console.log(chalk.green('✅ next.config.js found'));
  
  // Check for correct settings
  const nextConfigContent = fs.readFileSync(NEXT_CONFIG, 'utf8');
  
  if (!nextConfigContent.includes("output: 'standalone'")) {
    console.warn(chalk.yellow("⚠️ next.config.js does not have output: 'standalone'"));
  } else {
    console.log(chalk.green("✅ next.config.js has correct output setting"));
  }
  
  if (!nextConfigContent.includes('ignoreDuringBuilds: true')) {
    console.warn(chalk.yellow("⚠️ next.config.js might not skip linting during build"));
  } else {
    console.log(chalk.green("✅ next.config.js has correct linting settings"));
  }
}

// Check for public directory
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
if (!fs.existsSync(PUBLIC_DIR)) {
  console.warn(chalk.yellow('⚠️ public directory not found'));
} else {
  console.log(chalk.green('✅ public directory exists'));
}

// Check package.json
const PACKAGE_JSON = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(PACKAGE_JSON)) {
  console.error(chalk.red('❌ package.json not found!'));
  process.exit(1);
} else {
  console.log(chalk.green('✅ package.json found'));
  
  const packageJson = require(PACKAGE_JSON);
  if (!packageJson.scripts?.['build:netlify']) {
    console.error(chalk.red('❌ package.json is missing build:netlify script!'));
  } else {
    console.log(chalk.green('✅ build:netlify script found in package.json'));
  }
  
  if (!packageJson.dependencies?.['@netlify/functions']) {
    console.warn(chalk.yellow("⚠️ @netlify/functions dependency not found in package.json"));
  } else {
    console.log(chalk.green('✅ @netlify/functions dependency found'));
  }
}

console.log(chalk.blue('\nVerification complete. Ready for deployment!'));
console.log(chalk.blue('Recommended deployment command: netlify deploy --prod')); 