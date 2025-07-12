const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkDatabaseStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking database structure...\n');
    
    // Check activities table structure
    console.log('📊 ACTIVITIES TABLE STRUCTURE:');
    const activitiesStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'activities' 
      ORDER BY ordinal_position;
    `);
    
    if (activitiesStructure.rows.length > 0) {
      console.table(activitiesStructure.rows);
    } else {
      console.log('❌ Activities table not found or empty');
    }
    
    // Check recent activities data
    console.log('\n📈 RECENT ACTIVITIES DATA (Last 10):');
    const recentActivities = await client.query(`
      SELECT activity_id, user_id, activity_type, entity_type, entity_id, description, metadata, created_at
      FROM activities 
      ORDER BY created_at DESC 
      LIMIT 10;
    `);
    
    if (recentActivities.rows.length > 0) {
      console.table(recentActivities.rows);
    } else {
      console.log('❌ No activities found in database');
    }
    
    // Check feedback table structure
    console.log('\n💬 FEEDBACK TABLE STRUCTURE:');
    const feedbackStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'feedback' 
      ORDER BY ordinal_position;
    `);
    
    if (feedbackStructure.rows.length > 0) {
      console.table(feedbackStructure.rows);
    } else {
      console.log('❌ Feedback table not found - checking for trust_portal_feedback');
      
      const trustPortalFeedback = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'trust_portal_feedback' 
        ORDER BY ordinal_position;
      `);
      
      if (trustPortalFeedback.rows.length > 0) {
        console.table(trustPortalFeedback.rows);
      } else {
        console.log('❌ Trust portal feedback table not found either');
      }
    }
    
    // Check all tables in database
    console.log('\n📋 ALL TABLES IN DATABASE:');
    const allTables = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    if (allTables.rows.length > 0) {
      console.table(allTables.rows);
    }
    
    // Check for any feedback-related tables
    console.log('\n🔍 FEEDBACK-RELATED TABLES:');
    const feedbackTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%feedback%'
      ORDER BY table_name;
    `);
    
    if (feedbackTables.rows.length > 0) {
      console.table(feedbackTables.rows);
      
      // Check data in feedback tables
      for (const table of feedbackTables.rows) {
        console.log(`\n📊 DATA IN ${table.table_name.toUpperCase()}:`);
        const feedbackData = await client.query(`
          SELECT * FROM ${table.table_name} 
          ORDER BY created_at DESC 
          LIMIT 5;
        `);
        
        if (feedbackData.rows.length > 0) {
          console.table(feedbackData.rows);
        } else {
          console.log(`❌ No data found in ${table.table_name}`);
        }
      }
    } else {
      console.log('❌ No feedback-related tables found');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the check
checkDatabaseStructure().catch(console.error); 