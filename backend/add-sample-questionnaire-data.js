const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function addSampleQuestionnaireData() {
  try {
    console.log('🔍 Adding sample questionnaire data...\n');
    
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Sample questionnaire answers for different vendors
    const sampleAnswers = [
      // Acme Payments (vendor_id: 1)
      {
        vendor_id: 1,
        question_id: 'data_storage',
        question: 'Do you store personal data?',
        answer: 'Yes, we store customer payment information including names, email addresses, and encrypted payment details. All data is stored in compliance with PCI DSS standards.'
      },
      {
        vendor_id: 1,
        question_id: 'data_encryption',
        question: 'Is data encrypted at rest?',
        answer: 'Yes, all sensitive data is encrypted at rest using AES-256 encryption. Payment card data is tokenized and stored in a separate, highly secure environment.'
      },
      {
        vendor_id: 1,
        question_id: 'data_retention',
        question: 'Do you have a data retention policy?',
        answer: 'Yes, we maintain customer data for 7 years as required by financial regulations. After this period, data is securely deleted using DoD 5220.22-M standards.'
      },
      {
        vendor_id: 1,
        question_id: 'security_audits',
        question: 'Do you conduct regular security audits?',
        answer: 'Yes, we undergo annual PCI DSS compliance audits and quarterly penetration testing by certified third-party security firms.'
      },
      {
        vendor_id: 1,
        question_id: 'incident_response',
        question: 'Do you have an incident response plan?',
        answer: 'Yes, we have a comprehensive incident response plan that includes immediate containment, assessment, notification procedures, and post-incident analysis.'
      },
      
      // SecureCloud Inc (vendor_id: 4)
      {
        vendor_id: 4,
        question_id: 'data_storage',
        question: 'Do you store personal data?',
        answer: 'Yes, we store customer business data including contact information, usage analytics, and configuration settings for our cloud services.'
      },
      {
        vendor_id: 4,
        question_id: 'data_encryption',
        question: 'Is data encrypted at rest?',
        answer: 'Yes, all data is encrypted at rest using AES-256 encryption with customer-managed keys. Data in transit is protected using TLS 1.3.'
      },
      {
        vendor_id: 4,
        question_id: 'data_retention',
        question: 'Do you have a data retention policy?',
        answer: 'Yes, customer data is retained for the duration of the service agreement plus 3 years for backup and compliance purposes.'
      },
      {
        vendor_id: 4,
        question_id: 'security_audits',
        question: 'Do you conduct regular security audits?',
        answer: 'Yes, we maintain SOC 2 Type II certification and undergo annual security assessments. We also perform continuous vulnerability scanning.'
      },
      
      // Oscorp Industries (vendor_id: 5)
      {
        vendor_id: 5,
        question_id: 'data_storage',
        question: 'Do you store personal data?',
        answer: 'Yes, we store employee and research participant data as part of our operations. This includes personal identifiers and research data.'
      },
      {
        vendor_id: 5,
        question_id: 'data_encryption',
        question: 'Is data encrypted at rest?',
        answer: 'Partially. Critical research data is encrypted, but some operational data is stored in plaintext for performance reasons.'
      },
      {
        vendor_id: 5,
        question_id: 'data_retention',
        question: 'Do you have a data retention policy?',
        answer: 'We are currently developing a comprehensive data retention policy. Currently, data is retained indefinitely for research purposes.'
      },
      {
        vendor_id: 5,
        question_id: 'security_audits',
        question: 'Do you conduct regular security audits?',
        answer: 'We conduct internal security reviews quarterly, but have not yet engaged external auditors for comprehensive assessments.'
      }
    ];
    
    console.log(`\n📝 Adding ${sampleAnswers.length} questionnaire answers...`);
    
    for (const answer of sampleAnswers) {
      const insertQuery = `
        INSERT INTO vendor_questionnaire_answers (vendor_id, question_id, question, answer)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (vendor_id, question_id) 
        DO UPDATE SET 
          question = EXCLUDED.question,
          answer = EXCLUDED.answer,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, vendor_id, question_id
      `;
      
      const result = await client.query(insertQuery, [
        answer.vendor_id,
        answer.question_id,
        answer.question,
        answer.answer
      ]);
      
      console.log(`  ✅ Added answer for vendor ${answer.vendor_id}, question: ${answer.question_id}`);
    }
    
    // Verify the data was added
    const verifyQuery = `
      SELECT v.company_name, COUNT(vqa.id) as answer_count
      FROM vendors v
      LEFT JOIN vendor_questionnaire_answers vqa ON v.vendor_id = vqa.vendor_id
      GROUP BY v.vendor_id, v.company_name
      ORDER BY v.vendor_id
    `;
    
    const verifyResult = await client.query(verifyQuery);
    console.log(`\n📊 Verification - Questionnaire answers per vendor:`);
    verifyResult.rows.forEach(row => {
      console.log(`  - ${row.company_name}: ${row.answer_count} answers`);
    });
    
    client.release();
    console.log('\n✅ Sample questionnaire data added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  } finally {
    await pool.end();
  }
}

addSampleQuestionnaireData(); 