const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updateVendorsTable() {
  const client = await pool.connect();
  
  try {
    console.log('Updating vendors table to match expected schema...');
    
    // Enable UUID extension if not already enabled
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    
    // First, let's backup the existing data
    console.log('Backing up existing vendor data...');
    const existingVendors = await client.query('SELECT * FROM vendors');
    console.log(`Found ${existingVendors.rows.length} existing vendors`);
    
    // Drop the existing vendors table and recreate with new schema
    console.log('Dropping existing vendors table...');
    await client.query('DROP TABLE IF EXISTS vendor_questionnaire_answers CASCADE;');
    await client.query('DROP TABLE IF EXISTS vendors CASCADE;');
    
    // Create new vendors table with correct schema
    console.log('Creating new vendors table...');
    await client.query(`
      CREATE TABLE vendors (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Questionnaire Pending',
        risk_score INTEGER DEFAULT 50,
        risk_level VARCHAR(20) DEFAULT 'Medium',
        contact_name VARCHAR(255),
        contact_email VARCHAR(255),
        website VARCHAR(500),
        industry VARCHAR(255),
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create vendor_questionnaire_answers table
    console.log('Creating vendor_questionnaire_answers table...');
    await client.query(`
      CREATE TABLE vendor_questionnaire_answers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        vendor_id UUID NOT NULL,
        question_id VARCHAR(255) NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(vendor_id, question_id)
      );
    `);
    
    // Add foreign key constraint
    await client.query(`
      ALTER TABLE vendor_questionnaire_answers 
      ADD CONSTRAINT fk_vendor_questionnaire_answers_vendor_id 
      FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
    `);
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
      CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
      CREATE INDEX IF NOT EXISTS idx_vendor_answers_vendor_id ON vendor_questionnaire_answers(vendor_id);
    `);
    
    // Create trigger to update updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    await client.query(`
      CREATE TRIGGER update_vendors_updated_at
        BEFORE UPDATE ON vendors
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    
    await client.query(`
      CREATE TRIGGER update_vendor_answers_updated_at
        BEFORE UPDATE ON vendor_questionnaire_answers
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    
    // Migrate existing data if any
    if (existingVendors.rows.length > 0) {
      console.log('Migrating existing vendor data...');
      for (const vendor of existingVendors.rows) {
        await client.query(`
          INSERT INTO vendors (name, contact_email, created_at, updated_at)
          VALUES ($1, $2, $3, $4)
        `, [
          vendor.company_name || 'Unknown Company',
          vendor.email,
          vendor.created_at || new Date(),
          vendor.updated_at || new Date()
        ]);
      }
      console.log(`Migrated ${existingVendors.rows.length} vendors`);
    }
    
    // Insert sample data
    console.log('Inserting sample vendors...');
    await client.query(`
      INSERT INTO vendors (name, status, risk_score, risk_level, contact_name, contact_email, website, industry, description)
      VALUES 
        ('Acme Payments', 'Questionnaire Pending', 65, 'Medium', 'John Smith', 'john@acmepayments.com', 'https://acmepayments.com', 'Financial Services', 'Payment processing solutions'),
        ('TechSecure Solutions', 'In Review', 45, 'Low', 'Sarah Johnson', 'sarah@techsecure.com', 'https://techsecure.com', 'Cybersecurity', 'Security consulting and solutions'),
        ('Global Data Services', 'Approved', 30, 'Low', 'Mike Chen', 'mike@globaldata.com', 'https://globaldata.com', 'Data Analytics', 'Data processing and analytics platform'),
        ('SecureCloud Inc', 'Questionnaire Pending', 70, 'High', 'Lisa Brown', 'lisa@securecloud.com', 'https://securecloud.com', 'Cloud Services', 'Cloud infrastructure and security'),
        ('Oscorp Industries', 'In Review', 55, 'Medium', 'Norman Osborn', 'norman@oscorp.com', 'https://oscorp.com', 'Technology', 'Advanced technology solutions'),
        ('Umbrella Corporation', 'Approved', 25, 'Low', 'Alice Red', 'alice@umbrella.com', 'https://umbrella.com', 'Pharmaceuticals', 'Pharmaceutical research and development');
    `);
    
    console.log('Vendors table updated successfully!');
    
    // Show final table structure
    const finalStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'vendors'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nFinal vendors table structure:');
    finalStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
  } catch (error) {
    console.error('Error updating vendors table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  updateVendorsTable()
    .then(() => {
      console.log('Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = {
  updateVendorsTable
}; 