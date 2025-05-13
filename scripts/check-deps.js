import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const requiredDeps = [
  'tailwindcss',
  'autoprefixer',
  'postcss'
];

async function checkDependencies() {
  console.log('Checking dependencies before build...');
  
  // Check for missing dependencies
  const missingDeps = [];
  
  for (const dep of requiredDeps) {
    try {
      // Try to require the dependency
      const depPath = path.join(rootDir, 'node_modules', dep);
      if (!fs.existsSync(depPath)) {
        missingDeps.push(dep);
      }
    } catch (error) {
      missingDeps.push(dep);
    }
  }
  
  // Install missing dependencies
  if (missingDeps.length > 0) {
    console.log(`Installing missing dependencies: ${missingDeps.join(', ')}`);
    try {
      await execAsync(`npm install --save-dev ${missingDeps.join(' ')}`);
      console.log('Dependencies installed successfully!');
    } catch (error) {
      console.error('Error installing dependencies:', error);
      process.exit(1);
    }
  } else {
    console.log('All required dependencies are installed.');
  }
}

checkDependencies(); 