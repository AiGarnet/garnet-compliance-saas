#!/usr/bin/env node

/**
 * Migration Runner for 052_increase_file_type_column_length.sql
 * 
 * This script applies the database migration to increase file_type column lengths
 * from 50 to 100 characters across multiple tables to fix Excel file upload issues.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

async function runMigration() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔄 Starting migration 052: Increase file_type column length...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '052_increase_file_type_column_length.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Connect to database
    const client = await pool.connect();
    
    try {
      console.log('📊 Connected to database. Executing migration...');
      
      // Execute the migration
      await client.query(migrationSQL);
      
      console.log('✅ Migration 052 completed successfully!');
      console.log('📝 Changes applied:');
      console.log('   - checklists.file_type: VARCHAR(50) → VARCHAR(100)');
      console.log('   - checklist_supporting_documents.file_type: VARCHAR(50) → VARCHAR(100)');
      console.log('   - evidence_files.file_type: VARCHAR(50) → VARCHAR(100)');
      console.log('   - Added indexes for better query performance');
      console.log('');
      console.log('🎉 Excel files with long MIME types should now upload successfully!');
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = { runMigration };
