const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection configuration
const DATABASE_URL = 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway';

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for railway.app connections
  }
});

async function checkAndUpdateDatabase() {
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully');

    // Check if checklist_questions table exists
    console.log('\n📊 Checking database schema...');
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'checklist_questions';
    `);

    if (tableCheck.rows.length === 0) {
      console.log('❌ checklist_questions table does not exist');
      console.log('⚠️  Please run your main application migrations first');
      return;
    }

    console.log('✅ checklist_questions table exists');

    // Check if new columns exist
    console.log('\n🔍 Checking for document detection columns...');
    const columnCheck = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'checklist_questions' 
        AND column_name IN ('requires_document_confidence_score', 'requires_document_reason');
    `);

    const existingColumns = columnCheck.rows.map(row => row.column_name);
    const needsConfidenceScore = !existingColumns.includes('requires_document_confidence_score');
    const needsReason = !existingColumns.includes('requires_document_reason');

    if (!needsConfidenceScore && !needsReason) {
      console.log('✅ All required columns already exist');
      
      // Verify data integrity
      console.log('\n🔍 Checking data integrity...');
      const dataCheck = await client.query(`
        SELECT 
          COUNT(*) as total_questions,
          COUNT(requires_document_confidence_score) as questions_with_confidence,
          COUNT(requires_document_reason) as questions_with_reason,
          AVG(requires_document_confidence_score) as avg_confidence
        FROM checklist_questions;
      `);
      
      console.log('📈 Data summary:', dataCheck.rows[0]);
      
      // Show sample data
      const sampleData = await client.query(`
        SELECT 
          id, 
          question_text, 
          requires_document, 
          requires_document_confidence_score,
          requires_document_reason
        FROM checklist_questions 
        LIMIT 5;
      `);
      
      console.log('\n📋 Sample data:');
      sampleData.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.question_text?.substring(0, 50)}...`);
        console.log(`   Requires Doc: ${row.requires_document}, Confidence: ${row.requires_document_confidence_score}, Reason: ${row.requires_document_reason?.substring(0, 30)}...`);
      });
      
    } else {
      console.log('⚠️  Missing columns detected. Applying migration...');
      
      if (needsConfidenceScore) {
        console.log('➕ Adding requires_document_confidence_score column...');
        await client.query(`
          ALTER TABLE checklist_questions 
          ADD COLUMN requires_document_confidence_score DECIMAL(3,2) NULL;
        `);
      }
      
      if (needsReason) {
        console.log('➕ Adding requires_document_reason column...');
        await client.query(`
          ALTER TABLE checklist_questions 
          ADD COLUMN requires_document_reason TEXT NULL;
        `);
      }
      
      // Create index for performance
      console.log('📊 Creating performance index...');
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_checklist_questions_confidence_score 
        ON checklist_questions(requires_document_confidence_score);
      `);
      
      // Update existing records with default values
      console.log('🔄 Updating existing records with default values...');
      const updateResult = await client.query(`
        UPDATE checklist_questions 
        SET 
          requires_document_confidence_score = CASE 
            WHEN requires_document = true THEN 0.8 
            ELSE 0.2 
          END,
          requires_document_reason = CASE 
            WHEN requires_document = true THEN 'Legacy record - detected by basic keywords'
            ELSE 'Legacy record - no document indicators found'
          END
        WHERE requires_document_confidence_score IS NULL;
      `);
      
      console.log(`✅ Updated ${updateResult.rowCount} existing records`);
    }

    // Test document detection functionality
    console.log('\n🧪 Testing document detection logic...');
    
    const testQuestions = [
      "Please upload your business license",
      "What is your company name?", 
      "Provide proof of insurance certificate",
      "Attach your tax identification document",
      "How many employees do you have?"
    ];

    for (const question of testQuestions) {
      const detection = detectDocumentRequirementBasic(question);
      console.log(`📝 "${question.substring(0, 40)}..."`);
      console.log(`   → Requires Doc: ${detection.requiresDocument}, Confidence: ${detection.confidenceScore}, Reason: ${detection.reason}`);
    }

    console.log('\n✅ Database check and update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Basic document detection logic (matching the one in ChecklistsService)
function detectDocumentRequirementBasic(questionText) {
  const text = questionText.toLowerCase();
  
  // High confidence keywords
  const highConfidenceKeywords = ['upload', 'provide document', 'attach', 'certificate', 'license'];
  const mediumConfidenceKeywords = ['provide', 'submit', 'proof', 'evidence', 'documentation'];
  const lowConfidenceKeywords = ['copy', 'scan', 'file', 'record'];
  
  for (const keyword of highConfidenceKeywords) {
    if (text.includes(keyword)) {
      return {
        requiresDocument: true,
        confidenceScore: 0.9,
        reason: `High confidence - contains keyword: "${keyword}"`
      };
    }
  }
  
  for (const keyword of mediumConfidenceKeywords) {
    if (text.includes(keyword)) {
      return {
        requiresDocument: true,
        confidenceScore: 0.7,
        reason: `Medium confidence - contains keyword: "${keyword}"`
      };
    }
  }
  
  for (const keyword of lowConfidenceKeywords) {
    if (text.includes(keyword)) {
      return {
        requiresDocument: true,
        confidenceScore: 0.5,
        reason: `Low confidence - contains keyword: "${keyword}"`
      };
    }
  }
  
  return {
    requiresDocument: false,
    confidenceScore: 0.2,
    reason: 'No document-related keywords detected'
  };
}

// Run the check
console.log('🚀 Starting database check and update process...');
console.log('Database URL:', DATABASE_URL.replace(/:[^:]*@/, ':****@')); // Hide password in logs

checkAndUpdateDatabase().catch(console.error); 