#!/usr/bin/env node

console.log('Railway deployment script starting...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

try {
  console.log('Attempting to start application...');
  require('./dist/index.js');
} catch (error) {
  console.error('Failed to start application:', error);
  process.exit(1);
} 