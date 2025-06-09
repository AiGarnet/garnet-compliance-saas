const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addSampleQuestionnaireAnswers() {
  const client = await pool.connect();
  
  try {
    console.log('Adding sample questionnaire answers...');
    
    // Get vendor IDs
    const vendorsResult = await client.query('SELECT id, name FROM vendors ORDER BY name');
    const vendors = vendorsResult.rows;
    
    if (vendors.length === 0) {
      console.log('No vendors found. Please run the vendors migration first.');
      return;
    }
    
    // Sample questionnaire questions and answers
    const questionnaireData = [
      {
        vendorName: 'Acme Payments',
        answers: [
          {
            questionId: 'Q1',
            question: 'What security certifications does your organization hold?',
            answer: 'ISO 27001, SOC 2 Type II, PCI DSS Level 1'
          },
          {
            questionId: 'Q2', 
            question: 'How do you handle data encryption?',
            answer: 'We use AES-256 encryption for data at rest and TLS 1.3 for data in transit. All encryption keys are managed through AWS KMS.'
          },
          {
            questionId: 'Q3',
            question: 'What is your incident response procedure?',
            answer: 'We have a 24/7 security operations center (SOC) that monitors for incidents. Our incident response team follows NIST guidelines and can respond within 15 minutes of detection.'
          }
        ]
      },
      {
        vendorName: 'TechSecure Solutions',
        answers: [
          {
            questionId: 'Q1',
            question: 'What security certifications does your organization hold?',
            answer: 'ISO 27001, SOC 2 Type II, CISSP, CISA'
          },
          {
            questionId: 'Q2',
            question: 'How do you handle data encryption?',
            answer: 'End-to-end encryption using AES-256, with hardware security modules (HSMs) for key management.'
          },
          {
            questionId: 'Q3',
            question: 'What is your incident response procedure?',
            answer: 'Immediate containment within 5 minutes, full investigation within 1 hour, and client notification within 2 hours of confirmed incident.'
          },
          {
            questionId: 'Q4',
            question: 'How often do you conduct security assessments?',
            answer: 'Quarterly internal assessments and annual third-party penetration testing.'
          },
          {
            questionId: 'Q5',
            question: 'What backup and disaster recovery procedures do you have?',
            answer: 'Daily automated backups with 3-2-1 strategy, RPO of 1 hour, RTO of 4 hours for critical systems.'
          }
        ]
      },
      {
        vendorName: 'Global Data Services',
        answers: [
          {
            questionId: 'Q1',
            question: 'What security certifications does your organization hold?',
            answer: 'SOC 2 Type II, ISO 27001, GDPR compliance certification'
          },
          {
            questionId: 'Q2',
            question: 'How do you handle data encryption?',
            answer: 'Industry-standard encryption protocols with regular key rotation every 90 days.'
          },
          {
            questionId: 'Q3',
            question: 'What is your incident response procedure?',
            answer: 'Structured incident response plan with defined escalation procedures and stakeholder communication protocols.'
          },
          {
            questionId: 'Q4',
            question: 'How often do you conduct security assessments?',
            answer: 'Monthly vulnerability scans and annual compliance audits.'
          }
        ]
      },
      {
        vendorName: 'SecureCloud Inc',
        answers: [
          {
            questionId: 'Q1',
            question: 'What security certifications does your organization hold?',
            answer: 'Working towards ISO 27001 certification, currently SOC 2 Type I compliant'
          },
          {
            questionId: 'Q2',
            question: 'How do you handle data encryption?',
            answer: 'Standard encryption practices with plans to upgrade to advanced encryption standards in Q2 2024.'
          },
          {
            questionId: 'Q3',
            question: 'What is your incident response procedure?',
            answer: 'Basic incident response procedures in place, currently developing comprehensive incident response plan.'
          }
        ]
      }
    ];
    
    // Insert questionnaire answers for each vendor
    for (const vendorData of questionnaireData) {
      const vendor = vendors.find(v => v.name === vendorData.vendorName);
      
      if (!vendor) {
        console.log(`Vendor ${vendorData.vendorName} not found, skipping...`);
        continue;
      }
      
      console.log(`Adding answers for ${vendor.name}...`);
      
      // Check if answers already exist
      const existingAnswers = await client.query(
        'SELECT COUNT(*) FROM vendor_questionnaire_answers WHERE vendor_id = $1',
        [vendor.id]
      );
      
      if (existingAnswers.rows[0].count === '0') {
        for (const answer of vendorData.answers) {
          await client.query(`
            INSERT INTO vendor_questionnaire_answers (vendor_id, question_id, question, answer)
            VALUES ($1, $2, $3, $4)
          `, [vendor.id, answer.questionId, answer.question, answer.answer]);
        }
        
        console.log(`Added ${vendorData.answers.length} answers for ${vendor.name}`);
      } else {
        console.log(`Answers already exist for ${vendor.name}, skipping...`);
      }
    }
    
    console.log('Sample questionnaire answers added successfully!');
    
  } catch (error) {
    console.error('Error adding sample questionnaire answers:', error);
    throw error;
  } finally {
    client.release();
    pool.end();
  }
}

// Run the script
addSampleQuestionnaireAnswers()
  .then(() => {
    console.log('Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 