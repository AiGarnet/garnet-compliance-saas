const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration - using Railway PostgreSQL
const dbConfig = {
  host: 'shortline.proxy.rlwy.net',
  port: 28381,
  database: 'railway',
  user: 'postgres',
  password: 'FaHfoxEmIwaAJuzOmQTOfStkainUxzzX',
  ssl: { rejectUnauthorized: false } // Required for Railway
};

console.log('🚀 Starting Migration 008: Create Activities Table');
console.log('📊 Database Config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  ssl: !!dbConfig.ssl
});

async function runMigration() {
  const client = new Pool(dbConfig);
  
  try {
    // Test connection
    console.log('🔌 Testing database connection...');
    await client.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '008_create_activities_table.sql');
    console.log('📄 Reading migration file:', migrationPath);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📖 Migration file loaded successfully');

    // Check if activities table already exists
    console.log('🔍 Checking if activities table exists...');
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'activities'
      );
    `);
    
    const tableExists = tableCheckResult.rows[0].exists;
    
    if (tableExists) {
      console.log('⚠️  Activities table already exists');
      
      // Check if we need to add new columns or update structure
      const columnCheckResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      const existingColumns = columnCheckResult.rows.map(row => row.column_name);
      console.log('📋 Existing columns:', existingColumns);
      
      // Expected columns from our new migration
      const expectedColumns = [
        'id', 'type', 'status', 'description', 'user_id', 'user_name', 
        'user_email', 'entity_id', 'entity_type', 'entity_name', 
        'metadata', 'toast_config', 'created_at', 'updated_at'
      ];
      
      const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('🔄 Missing columns detected:', missingColumns);
        console.log('⚠️  Please update the migration or create an incremental migration');
      } else {
        console.log('✅ Table structure appears up to date');
      }
      
      return;
    }

    // Run the migration
    console.log('🚀 Running migration 008...');
    console.log('⏳ This may take a moment...');
    
    await client.query(migrationSQL);
    
    console.log('✅ Migration 008 completed successfully!');

    // Verify the table was created
    console.log('🔍 Verifying table creation...');
    const verifyResult = await client.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'activities') as column_count
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'activities';
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Activities table created successfully');
      console.log(`📊 Table has ${verifyResult.rows[0].column_count} columns`);
    } else {
      throw new Error('Failed to verify table creation');
    }

    // Check if sample data was inserted
    console.log('🔍 Checking sample data...');
    const sampleDataResult = await client.query('SELECT COUNT(*) as count FROM activities;');
    const sampleCount = parseInt(sampleDataResult.rows[0].count);
    
    if (sampleCount > 0) {
      console.log(`✅ Sample data inserted: ${sampleCount} activities`);
    } else {
      console.log('ℹ️  No sample data found (this is normal if sample data insertion was skipped)');
    }

    // List available activity types
    console.log('🔍 Checking activity types enum...');
    const enumResult = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'activity_type'
      )
      ORDER BY enumlabel;
    `);
    
    if (enumResult.rows.length > 0) {
      console.log('📋 Available activity types:');
      enumResult.rows.forEach(row => {
        console.log(`   - ${row.enumlabel}`);
      });
    }

    console.log('🎉 Migration 008 completed successfully!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Start your backend server');
    console.log('2. Test the activity logging endpoints');
    console.log('3. Check the frontend toast notifications');
    console.log('4. Verify activity tracking in the dashboard');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    if (error.code) {
      console.error('📋 Error details:');
      console.error(`   Code: ${error.code}`);
      console.error(`   Detail: ${error.detail || 'N/A'}`);
      console.error(`   Hint: ${error.hint || 'N/A'}`);
    }
    
    console.error('');
    console.error('💡 Troubleshooting tips:');
    console.error('1. Check your database connection settings');
    console.error('2. Ensure the database exists and is accessible');
    console.error('3. Verify the user has proper permissions');
    console.error('4. Check if there are any conflicting table names');
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⏹️  Migration interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Migration terminated');
  process.exit(0);
});

// Run the migration
runMigration().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
}); 