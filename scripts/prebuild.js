import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Pre-build script - Installing Tailwind and PostCSS dependencies');

// Create a backup of the original package.json
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJsonBackupPath = path.join(rootDir, 'package.json.backup');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Backup original package.json
fs.writeFileSync(packageJsonBackupPath, JSON.stringify(packageJson, null, 2));

// Ensure these dependencies exist
const requiredDeps = {
  tailwindcss: "^3.3.5",
  autoprefixer: "^10.4.16",
  postcss: "^8.4.31"
};

// Update devDependencies
packageJson.devDependencies = {
  ...packageJson.devDependencies,
  ...requiredDeps
};

// Write updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

try {
  // Force install the required dependencies
  console.log('Installing Tailwind and PostCSS dependencies...');
  execSync('npm install -D tailwindcss autoprefixer postcss', { 
    stdio: 'inherit',
    cwd: rootDir
  });
  
  console.log('Successfully installed Tailwind dependencies');
} catch (error) {
  console.error('Error installing dependencies:', error);
  // Restore original package.json
  if (fs.existsSync(packageJsonBackupPath)) {
    fs.copyFileSync(packageJsonBackupPath, packageJsonPath);
  }
  process.exit(1);
} finally {
  // Clean up backup
  if (fs.existsSync(packageJsonBackupPath)) {
    fs.unlinkSync(packageJsonBackupPath);
  }
}

console.log('Pre-build tasks completed successfully!'); 