const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function addFollowUpTracking() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Adding follow-up tracking functionality...');
    
    // Step 1: Add follow-up columns to trust_portal_items table
    console.log('📝 Adding follow-up columns to trust_portal_items...');
    
    await client.query(`
      ALTER TABLE trust_portal_items 
      ADD COLUMN IF NOT EXISTS is_follow_up BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS parent_submission_id INTEGER,
      ADD COLUMN IF NOT EXISTS follow_up_type VARCHAR(50) DEFAULT 'initial',
      ADD COLUMN IF NOT EXISTS follow_up_reason TEXT,
      ADD COLUMN IF NOT EXISTS submission_sequence INTEGER DEFAULT 1
    `);
    
    // Step 2: Add constraints and indexes
    console.log('🔗 Adding constraints and indexes...');
    
    // Drop constraint if it exists, then add it
    await client.query(`
      ALTER TABLE trust_portal_items 
      DROP CONSTRAINT IF EXISTS chk_follow_up_type
    `);
    
    await client.query(`
      ALTER TABLE trust_portal_items 
      ADD CONSTRAINT chk_follow_up_type 
      CHECK (follow_up_type IN ('initial', 'follow_up', 'resubmission', 'clarification', 'additional_docs'))
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_trust_portal_items_is_follow_up 
      ON trust_portal_items(is_follow_up)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_trust_portal_items_parent_submission 
      ON trust_portal_items(parent_submission_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_trust_portal_items_follow_up_type 
      ON trust_portal_items(follow_up_type)
    `);
    
    // Step 3: Add follow-up tracking to trust_portal_feedback table
    console.log('📋 Adding follow-up tracking to feedback system...');
    
    await client.query(`
      ALTER TABLE trust_portal_feedback 
      ADD COLUMN IF NOT EXISTS related_submission_id INTEGER,
      ADD COLUMN IF NOT EXISTS requires_follow_up BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS follow_up_deadline TIMESTAMP WITH TIME ZONE
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_trust_portal_feedback_related_submission 
      ON trust_portal_feedback(related_submission_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_trust_portal_feedback_requires_follow_up 
      ON trust_portal_feedback(requires_follow_up)
    `);
    
    // Step 4: Create a view for follow-up tracking
    console.log('👁️ Creating follow-up tracking view...');
    
    await client.query(`
      CREATE OR REPLACE VIEW trust_portal_follow_up_tracking AS
      SELECT 
        tpi.id,
        tpi.vendor_id,
        tpi.title,
        tpi.category,
        tpi.is_follow_up,
        tpi.parent_submission_id,
        tpi.follow_up_type,
        tpi.follow_up_reason,
        tpi.submission_sequence,
        tpi.created_at as submission_date,
        parent.title as parent_title,
        parent.created_at as parent_date,
        v.company_name as vendor_name,
        CASE 
          WHEN tpi.is_follow_up = false THEN 'Initial Submission'
          WHEN tpi.follow_up_type = 'follow_up' THEN 'Follow-up Submission'
          WHEN tpi.follow_up_type = 'resubmission' THEN 'Resubmission'
          WHEN tpi.follow_up_type = 'clarification' THEN 'Clarification'
          WHEN tpi.follow_up_type = 'additional_docs' THEN 'Additional Documents'
          ELSE 'Unknown'
        END as submission_type_display
      FROM trust_portal_items tpi
      LEFT JOIN trust_portal_items parent ON tpi.parent_submission_id = parent.id
      LEFT JOIN vendors v ON tpi.vendor_id = v.vendor_id
      WHERE tpi.is_questionnaire_answer = true
      ORDER BY tpi.vendor_id, tpi.submission_sequence, tpi.created_at DESC
    `);
    
    // Step 5: Create helper functions
    console.log('🛠️ Creating helper functions...');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION get_submission_sequence(vendor_id_param INTEGER)
      RETURNS INTEGER AS $$
      BEGIN
        RETURN COALESCE(
          (SELECT MAX(submission_sequence) + 1 
           FROM trust_portal_items 
           WHERE vendor_id = vendor_id_param AND is_questionnaire_answer = true),
          1
        );
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await client.query(`
      CREATE OR REPLACE FUNCTION mark_submission_as_follow_up(
        submission_id INTEGER,
        parent_id INTEGER,
        follow_type VARCHAR(50),
        reason TEXT DEFAULT NULL
      )
      RETURNS BOOLEAN AS $$
      DECLARE
        vendor_id_val INTEGER;
        next_sequence INTEGER;
      BEGIN
        -- Get vendor_id from the submission
        SELECT vendor_id INTO vendor_id_val 
        FROM trust_portal_items 
        WHERE id = submission_id;
        
        -- Get next sequence number
        SELECT get_submission_sequence(vendor_id_val) INTO next_sequence;
        
        -- Update the submission
        UPDATE trust_portal_items 
        SET 
          is_follow_up = true,
          parent_submission_id = parent_id,
          follow_up_type = follow_type,
          follow_up_reason = reason,
          submission_sequence = next_sequence
        WHERE id = submission_id;
        
        RETURN FOUND;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Step 6: Update existing records to have proper sequence numbers
    console.log('🔄 Updating existing records...');
    
    await client.query(`
      WITH vendor_sequences AS (
        SELECT 
          id,
          vendor_id,
          ROW_NUMBER() OVER (PARTITION BY vendor_id ORDER BY created_at) as seq
        FROM trust_portal_items 
        WHERE is_questionnaire_answer = true
      )
      UPDATE trust_portal_items 
      SET submission_sequence = vs.seq
      FROM vendor_sequences vs
      WHERE trust_portal_items.id = vs.id
    `);
    
    console.log('✅ Follow-up tracking functionality added successfully!');
    
    // Step 7: Create some sample data for testing
    console.log('📊 Creating sample follow-up data...');
    
    const sampleResult = await client.query(`
      SELECT id, vendor_id, title 
      FROM trust_portal_items 
      WHERE is_questionnaire_answer = true 
      LIMIT 2
    `);
    
    if (sampleResult.rows.length >= 2) {
      const parentId = sampleResult.rows[0].id;
      const followUpId = sampleResult.rows[1].id;
      
      await client.query(`
        SELECT mark_submission_as_follow_up(
          $1, 
          $2, 
          'follow_up', 
          'Additional documentation requested by enterprise'
        )
      `, [followUpId, parentId]);
      
      console.log(`✅ Sample follow-up relationship created: ${followUpId} -> ${parentId}`);
    }
    
    // Step 8: Show some statistics
    console.log('\n📈 Follow-up Tracking Statistics:');
    
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(*) FILTER (WHERE is_follow_up = false) as initial_submissions,
        COUNT(*) FILTER (WHERE is_follow_up = true) as follow_up_submissions,
        COUNT(DISTINCT vendor_id) as vendors_with_submissions
      FROM trust_portal_items 
      WHERE is_questionnaire_answer = true
    `);
    
    console.log('Total submissions:', stats.rows[0].total_submissions);
    console.log('Initial submissions:', stats.rows[0].initial_submissions);
    console.log('Follow-up submissions:', stats.rows[0].follow_up_submissions);
    console.log('Vendors with submissions:', stats.rows[0].vendors_with_submissions);
    
    const followUpTypes = await client.query(`
      SELECT 
        follow_up_type,
        COUNT(*) as count
      FROM trust_portal_items 
      WHERE is_questionnaire_answer = true
      GROUP BY follow_up_type
      ORDER BY count DESC
    `);
    
    console.log('\nSubmission types:');
    followUpTypes.rows.forEach(row => {
      console.log(`  ${row.follow_up_type}: ${row.count}`);
    });
    
  } catch (error) {
    console.error('❌ Error adding follow-up tracking:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Helper function to get follow-up submissions for a vendor
async function getFollowUpSubmissions(vendorId) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT * FROM trust_portal_follow_up_tracking 
      WHERE vendor_id = $1 
      ORDER BY submission_sequence, submission_date DESC
    `, [vendorId]);
    
    return result.rows;
  } finally {
    client.release();
  }
}

// Helper function to create a follow-up submission
async function createFollowUpSubmission(vendorId, parentSubmissionId, submissionData, followUpType = 'follow_up', reason = null) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get next sequence number
    const sequenceResult = await client.query(`
      SELECT get_submission_sequence($1) as next_sequence
    `, [vendorId]);
    
    const nextSequence = sequenceResult.rows[0].next_sequence;
    
    // Insert the new submission
    const insertResult = await client.query(`
      INSERT INTO trust_portal_items (
        vendor_id, title, description, category, content, 
        is_questionnaire_answer, is_follow_up, parent_submission_id, 
        follow_up_type, follow_up_reason, submission_sequence
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [
      vendorId,
      submissionData.title,
      submissionData.description,
      submissionData.category || 'Questionnaire',
      submissionData.content,
      true, // is_questionnaire_answer
      true, // is_follow_up
      parentSubmissionId,
      followUpType,
      reason,
      nextSequence
    ]);
    
    await client.query('COMMIT');
    
    return insertResult.rows[0].id;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
if (require.main === module) {
  addFollowUpTracking()
    .then(() => {
      console.log('\n🎉 Follow-up tracking setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = {
  addFollowUpTracking,
  getFollowUpSubmissions,
  createFollowUpSubmission
}; 