const { Client } = require('pg');

class VendorDatabaseUtility {
  constructor() {
    this.client = new Client({
      connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
      ssl: { rejectUnauthorized: false }
    });
  }

  async connect() {
    await this.client.connect();
    console.log('🔗 Connected to database');
  }

  async disconnect() {
    await this.client.end();
    console.log('🔌 Disconnected from database');
  }

  async examineVendorStructure() {
    console.log('\n📊 EXAMINING VENDOR TABLE STRUCTURE\n');
    
    try {
      // Get table structure
      const structureQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'vendors' 
        ORDER BY ordinal_position;
      `;
      
      const result = await this.client.query(structureQuery);
      
      console.log('📋 Current Vendor Table Columns:');
      result.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
      });
      
      return result.rows;
    } catch (error) {
      console.error('❌ Error examining vendor structure:', error.message);
      return [];
    }
  }

  async checkVendorData() {
    console.log('\n📈 CHECKING VENDOR DATA\n');
    
    try {
      // Get sample vendor data
      const dataQuery = `
        SELECT 
          id,
          name,
          status,
          organization_id,
          risk_score,
          risk_level,
          created_at
        FROM vendors 
        LIMIT 5;
      `;
      
      const result = await this.client.query(dataQuery);
      
      console.log(`📊 Found ${result.rows.length} vendor records (showing first 5):`);
      result.rows.forEach((vendor, index) => {
        console.log(`  ${index + 1}. ${vendor.name}`);
        console.log(`     ID: ${vendor.id}`);
        console.log(`     Status: ${vendor.status}`);
        console.log(`     Organization ID: ${vendor.organization_id}`);
        console.log(`     Risk Score: ${vendor.risk_score}`);
        console.log(`     Risk Level: ${vendor.risk_level}`);
        console.log(`     Created: ${vendor.created_at}`);
        console.log('');
      });
      
      // Count total vendors
      const countResult = await this.client.query('SELECT COUNT(*) as total FROM vendors');
      console.log(`📊 Total vendors in database: ${countResult.rows[0].total}`);
      
      // Count vendors by organization
      const orgCountQuery = `
        SELECT 
          organization_id,
          COUNT(*) as vendor_count
        FROM vendors 
        GROUP BY organization_id
        ORDER BY vendor_count DESC;
      `;
      const orgResult = await this.client.query(orgCountQuery);
      
      console.log('\n🏢 Vendors by Organization:');
      orgResult.rows.forEach(org => {
        console.log(`  Org ID ${org.organization_id}: ${org.vendor_count} vendors`);
      });
      
      return result.rows;
    } catch (error) {
      console.error('❌ Error checking vendor data:', error.message);
      return [];
    }
  }

  async checkRiskFieldUsage() {
    console.log('\n🔍 CHECKING RISK SCORE/LEVEL USAGE\n');
    
    try {
      // Check if risk fields have data
      const riskQuery = `
        SELECT 
          COUNT(*) as total_vendors,
          COUNT(risk_score) as vendors_with_risk_score,
          COUNT(risk_level) as vendors_with_risk_level,
          COUNT(CASE WHEN risk_score IS NOT NULL OR risk_level IS NOT NULL THEN 1 END) as vendors_with_any_risk_data
        FROM vendors;
      `;
      
      const result = await this.client.query(riskQuery);
      const stats = result.rows[0];
      
      console.log('📊 Risk Field Usage Statistics:');
      console.log(`  Total vendors: ${stats.total_vendors}`);
      console.log(`  Vendors with risk_score: ${stats.vendors_with_risk_score}`);
      console.log(`  Vendors with risk_level: ${stats.vendors_with_risk_level}`);
      console.log(`  Vendors with any risk data: ${stats.vendors_with_any_risk_data}`);
      
      const usagePercentage = stats.total_vendors > 0 
        ? ((stats.vendors_with_any_risk_data / stats.total_vendors) * 100).toFixed(1)
        : 0;
      
      console.log(`  Risk data usage: ${usagePercentage}%`);
      
      if (stats.vendors_with_any_risk_data > 0) {
        console.log('\n⚠️  Some vendors have risk data - check if it\'s needed before removal');
        
        // Show sample risk data
        const sampleQuery = `
          SELECT name, risk_score, risk_level 
          FROM vendors 
          WHERE risk_score IS NOT NULL OR risk_level IS NOT NULL 
          LIMIT 3;
        `;
        const sampleResult = await this.client.query(sampleQuery);
        
        console.log('\n📋 Sample vendors with risk data:');
        sampleResult.rows.forEach(vendor => {
          console.log(`  ${vendor.name}: score=${vendor.risk_score}, level=${vendor.risk_level}`);
        });
      } else {
        console.log('\n✅ No risk data found - safe to remove columns');
      }
      
      return stats;
    } catch (error) {
      console.error('❌ Error checking risk field usage:', error.message);
      return null;
    }
  }

  async removeRiskFields() {
    console.log('\n🗑️  REMOVING RISK SCORE AND RISK LEVEL COLUMNS\n');
    
    try {
      // First, check if columns exist
      const checkQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'vendors' 
        AND column_name IN ('risk_score', 'risk_level');
      `;
      
      const checkResult = await this.client.query(checkQuery);
      const existingColumns = checkResult.rows.map(row => row.column_name);
      
      if (existingColumns.length === 0) {
        console.log('✅ Risk columns not found - already removed or never existed');
        return;
      }
      
      console.log(`📋 Found columns to remove: ${existingColumns.join(', ')}`);
      
      // Remove risk_score column if it exists
      if (existingColumns.includes('risk_score')) {
        await this.client.query('ALTER TABLE vendors DROP COLUMN IF EXISTS risk_score');
        console.log('✅ Removed risk_score column');
      }
      
      // Remove risk_level column if it exists
      if (existingColumns.includes('risk_level')) {
        await this.client.query('ALTER TABLE vendors DROP COLUMN IF EXISTS risk_level');
        console.log('✅ Removed risk_level column');
      }
      
      console.log('🎉 Successfully removed risk columns from vendors table');
      
    } catch (error) {
      console.error('❌ Error removing risk fields:', error.message);
      throw error;
    }
  }

  async checkOrganizationIsolation() {
    console.log('\n🔒 CHECKING ORGANIZATION ISOLATION\n');
    
    try {
      // Check if all vendors have organization_id
      const isolationQuery = `
        SELECT 
          COUNT(*) as total_vendors,
          COUNT(organization_id) as vendors_with_org_id,
          COUNT(CASE WHEN organization_id IS NULL THEN 1 END) as vendors_without_org_id
        FROM vendors;
      `;
      
      const result = await this.client.query(isolationQuery);
      const stats = result.rows[0];
      
      console.log('📊 Organization Isolation Status:');
      console.log(`  Total vendors: ${stats.total_vendors}`);
      console.log(`  Vendors with organization_id: ${stats.vendors_with_org_id}`);
      console.log(`  Vendors without organization_id: ${stats.vendors_without_org_id}`);
      
      if (stats.vendors_without_org_id > 0) {
        console.log('\n⚠️  WARNING: Some vendors lack organization_id - this breaks isolation!');
        
        // Show vendors without organization_id
        const orphanQuery = `
          SELECT id, name, status, created_at 
          FROM vendors 
          WHERE organization_id IS NULL 
          LIMIT 5;
        `;
        const orphanResult = await this.client.query(orphanQuery);
        
        console.log('\n📋 Vendors without organization_id:');
        orphanResult.rows.forEach(vendor => {
          console.log(`  ${vendor.id}: ${vendor.name} (${vendor.status})`);
        });
      } else {
        console.log('\n✅ All vendors have organization_id - isolation is intact');
      }
      
      return stats;
    } catch (error) {
      console.error('❌ Error checking organization isolation:', error.message);
      return null;
    }
  }

  async testVendorQueries() {
    console.log('\n🧪 TESTING VENDOR QUERIES\n');
    
    try {
      // Test basic vendor selection
      console.log('🔍 Testing basic vendor query...');
      const basicQuery = `
        SELECT id, name, status, organization_id 
        FROM vendors 
        LIMIT 3;
      `;
      const basicResult = await this.client.query(basicQuery);
      console.log(`✅ Basic query successful - returned ${basicResult.rows.length} vendors`);
      
      // Test organization-filtered query
      console.log('\n🔍 Testing organization-filtered query...');
      const orgFilterQuery = `
        SELECT v.id, v.name, v.status, v.organization_id, o.name as org_name
        FROM vendors v
        LEFT JOIN organizations o ON v.organization_id = o.id
        WHERE v.organization_id IS NOT NULL
        LIMIT 3;
      `;
      const orgResult = await this.client.query(orgFilterQuery);
      console.log(`✅ Organization-filtered query successful - returned ${orgResult.rows.length} vendors`);
      
      if (orgResult.rows.length > 0) {
        console.log('\n📋 Sample organization-filtered results:');
        orgResult.rows.forEach(vendor => {
          console.log(`  ${vendor.name} (${vendor.org_name || 'Unknown Org'})`);
        });
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error testing vendor queries:', error.message);
      return false;
    }
  }

  async generateBackendVendorModel() {
    console.log('\n🔧 GENERATING BACKEND VENDOR MODEL RECOMMENDATIONS\n');
    
    const structure = await this.examineVendorStructure();
    
    console.log('📋 Recommended Backend Vendor Interface:');
    console.log(`
interface Vendor {
  id: string;
  name: string;
  status: string;
  organization_id: string;
  created_at: Date;
  updated_at: Date;
  // Remove: risk_score, risk_level (not used in frontend)
}

// Recommended API endpoint structure:
// GET /api/vendors?organization_id=<id> (public, filtered by org)
// POST /api/vendors (authenticated, auto-assign org from token)
// PUT /api/vendors/:id (authenticated, check org ownership)
// DELETE /api/vendors/:id (authenticated, check org ownership)
    `);
  }

  async runFullAnalysis() {
    try {
      console.log('🚀 STARTING VENDOR DATABASE ANALYSIS\n');
      console.log('=' * 60);
      
      await this.connect();
      
      // Step 1: Examine structure
      await this.examineVendorStructure();
      
      // Step 2: Check current data
      await this.checkVendorData();
      
      // Step 3: Check risk field usage
      const riskStats = await this.checkRiskFieldUsage();
      
      // Step 4: Check organization isolation
      await this.checkOrganizationIsolation();
      
      // Step 5: Test queries
      await this.testVendorQueries();
      
      // Step 6: Generate recommendations
      await this.generateBackendVendorModel();
      
      console.log('\n🎯 SUMMARY & RECOMMENDATIONS\n');
      console.log('1. ✅ Remove risk_score and risk_level columns (not used in frontend)');
      console.log('2. ✅ Make vendor endpoints public with organization filtering');
      console.log('3. ✅ Ensure all vendors have organization_id for proper isolation');
      console.log('4. ✅ Update backend API to use organization-based filtering');
      console.log('5. ✅ Remove authentication requirements for GET operations');
      
      console.log('\n🛠️  NEXT STEPS:\n');
      console.log('- Run utility.removeRiskFields() to clean up unused columns');
      console.log('- Update backend vendor controller to use organization filtering');
      console.log('- Update frontend to pass organization_id in vendor requests');
      console.log('- Test the new public API with organization isolation');
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
    } finally {
      await this.disconnect();
    }
  }
}

// Usage functions
async function runAnalysis() {
  const utility = new VendorDatabaseUtility();
  await utility.runFullAnalysis();
}

async function removeRiskFields() {
  const utility = new VendorDatabaseUtility();
  try {
    await utility.connect();
    await utility.removeRiskFields();
    console.log('\n✅ Risk fields removal completed');
  } catch (error) {
    console.error('❌ Failed to remove risk fields:', error);
  } finally {
    await utility.disconnect();
  }
}

async function checkConsistency() {
  const utility = new VendorDatabaseUtility();
  try {
    await utility.connect();
    await utility.examineVendorStructure();
    await utility.checkOrganizationIsolation();
    await utility.testVendorQueries();
  } catch (error) {
    console.error('❌ Consistency check failed:', error);
  } finally {
    await utility.disconnect();
  }
}

// Export for use
module.exports = {
  VendorDatabaseUtility,
  runAnalysis,
  removeRiskFields,
  checkConsistency
};

// If run directly
if (require.main === module) {
  const action = process.argv[2];
  
  switch (action) {
    case 'analyze':
      runAnalysis();
      break;
    case 'remove-risk':
      removeRiskFields();
      break;
    case 'check':
      checkConsistency();
      break;
    default:
      console.log('🔧 Vendor Database Utility');
      console.log('\nUsage:');
      console.log('  node database-vendor-utility.js analyze     - Run full analysis');
      console.log('  node database-vendor-utility.js remove-risk - Remove risk columns');
      console.log('  node database-vendor-utility.js check       - Check consistency');
      console.log('\nOr import and use specific functions:');
      console.log('  const { runAnalysis } = require("./database-vendor-utility.js");');
  }
} 