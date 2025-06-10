const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Create migrations tracking table
async function createMigrationsTable() {
  const client = await pool.connect();
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(255)
      );
    `);
    
    console.log('Schema migrations table created/verified');
  } catch (error) {
    console.error('Error creating migrations table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Get applied migrations
async function getAppliedMigrations() {
  const client = await pool.connect();
  
  try {
    const result = await client.query('SELECT version FROM schema_migrations ORDER BY version');
    return result.rows.map(row => row.version);
  } catch (error) {
    console.error('Error getting applied migrations:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Record migration as applied
async function recordMigration(version, checksum) {
  const client = await pool.connect();
  
  try {
    await client.query(
      'INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)',
      [version, checksum]
    );
    console.log(`Migration ${version} recorded as applied`);
  } catch (error) {
    console.error(`Error recording migration ${version}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

// Remove migration record
async function removeMigrationRecord(version) {
  const client = await pool.connect();
  
  try {
    await client.query('DELETE FROM schema_migrations WHERE version = $1', [version]);
    console.log(`Migration ${version} record removed`);
  } catch (error) {
    console.error(`Error removing migration record ${version}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

// Execute SQL file
async function executeSqlFile(filePath) {
  const client = await pool.connect();
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await client.query(sql);
    console.log(`Executed SQL file: ${filePath}`);
  } catch (error) {
    console.error(`Error executing SQL file ${filePath}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

// Generate checksum for file content
function generateChecksum(content) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(content).digest('hex');
}

// Run migrations
async function runMigrations() {
  try {
    await createMigrationsTable();
    
    const migrationsDir = __dirname;
    const appliedMigrations = await getAppliedMigrations();
    
    // Get all SQL migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') && !file.includes('_rollback'))
      .sort();
    
    console.log('Found migration files:', migrationFiles);
    console.log('Applied migrations:', appliedMigrations);
    
    for (const file of migrationFiles) {
      const version = file.replace('.sql', '');
      
      if (!appliedMigrations.includes(version)) {
        console.log(`Applying migration: ${version}`);
        
        const filePath = path.join(migrationsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const checksum = generateChecksum(content);
        
        await executeSqlFile(filePath);
        await recordMigration(version, checksum);
        
        console.log(`✓ Migration ${version} applied successfully`);
      } else {
        console.log(`⏭ Migration ${version} already applied`);
      }
    }
    
    console.log('All migrations completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Rollback last migration
async function rollbackLastMigration() {
  try {
    const appliedMigrations = await getAppliedMigrations();
    
    if (appliedMigrations.length === 0) {
      console.log('No migrations to rollback');
      return;
    }
    
    const lastMigration = appliedMigrations[appliedMigrations.length - 1];
    console.log(`Rolling back migration: ${lastMigration}`);
    
    const rollbackFile = `${lastMigration}_rollback.sql`;
    const rollbackPath = path.join(__dirname, rollbackFile);
    
    if (fs.existsSync(rollbackPath)) {
      await executeSqlFile(rollbackPath);
      await removeMigrationRecord(lastMigration);
      console.log(`✓ Migration ${lastMigration} rolled back successfully`);
    } else {
      console.log(`⚠ Rollback file not found: ${rollbackFile}`);
    }
    
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'rollback') {
    rollbackLastMigration()
      .then(() => {
        console.log('Rollback completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Rollback failed:', error);
        process.exit(1);
      });
  } else {
    runMigrations()
      .then(() => {
        console.log('Migrations completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Migrations failed:', error);
        process.exit(1);
      });
  }
}

module.exports = {
  runMigrations,
  rollbackLastMigration
}; 