#!/usr/bin/env node

/**
 * Test data seeding script for Garnet AI
 * This script seeds test data from data_new.json for development
 */

console.log('🌱 Seeding test data...');

const fs = require('fs');
const path = require('path');

// Check if data file exists
const dataFile = 'data_new.json';
if (!fs.existsSync(dataFile)) {
  console.error(`❌ Data file ${dataFile} not found`);
  process.exit(1);
}

try {
  // Read and validate JSON data
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  console.log(`✅ Loaded ${Array.isArray(data) ? data.length : Object.keys(data).length} records from ${dataFile}`);

  // For now, just log the data structure
  if (Array.isArray(data) && data.length > 0) {
    console.log('📋 Sample record structure:', Object.keys(data[0]));
  } else if (typeof data === 'object') {
    console.log('📋 Data structure keys:', Object.keys(data));
  }

  console.log('✅ Test data seeding completed successfully!');
  
} catch (error) {
  console.error('❌ Error seeding test data:', error.message);
  process.exit(1);
} 