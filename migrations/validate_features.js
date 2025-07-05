const { Client } = require('pg');

const config = {
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: {
    rejectUnauthorized: false
  }
};

async function validateFeatures() {
  const client = new Client(config);
  const report = {
    features: {},
    summary: {
      total_features: 0,
      passed_features: 0,
      failed_features: 0
    }
  };
  
  try {
    await client.connect();
    console.log('Connected to database');

    // Test Feature 1: Vendor Invite Token Generation
    console.log('\nTesting Vendor Invite Token Generation...');
    report.features.token_generation = { status: 'testing', issues: [] };
    try {
      // Insert test vendor if needed
      const vendorId = 1;
      const token = 'test_token_' + Date.now();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await client.query(`
        INSERT INTO vendor_invite_tokens 
        (vendor_id, token, expires_at) 
        VALUES ($1, $2, $3)
        RETURNING token_id`,
        [vendorId, token, expiresAt]
      );

      // Verify token was created
      const tokenCheck = await client.query(
        'SELECT * FROM vendor_invite_tokens WHERE token = $1',
        [token]
      );

      if (tokenCheck.rows.length === 1 && tokenCheck.rows[0].is_active === true) {
        report.features.token_generation.status = 'passed';
      } else {
        report.features.token_generation.status = 'failed';
        report.features.token_generation.issues.push('Token creation verification failed');
      }

      // Cleanup test token
      await client.query('DELETE FROM vendor_invite_tokens WHERE token = $1', [token]);
    } catch (error) {
      report.features.token_generation.status = 'failed';
      report.features.token_generation.issues.push(error.message);
    }

    // Test Feature 2: Enterprise Feedback Creation
    console.log('Testing Enterprise Feedback Creation...');
    report.features.feedback_creation = { status: 'testing', issues: [] };
    try {
      const vendorId = 1;
      const testFeedback = {
        enterprise_name: 'Test Enterprise',
        feedback_text: 'Test feedback',
        rating: 5,
        is_public: false
      };

      const feedbackResult = await client.query(`
        INSERT INTO enterprise_feedback 
        (vendor_id, enterprise_name, feedback_text, rating, is_public) 
        VALUES ($1, $2, $3, $4, $5)
        RETURNING feedback_id`,
        [vendorId, testFeedback.enterprise_name, testFeedback.feedback_text, 
         testFeedback.rating, testFeedback.is_public]
      );

      // Verify feedback was created
      const feedbackCheck = await client.query(
        'SELECT * FROM enterprise_feedback WHERE feedback_id = $1',
        [feedbackResult.rows[0].feedback_id]
      );

      if (feedbackCheck.rows.length === 1) {
        report.features.feedback_creation.status = 'passed';
      } else {
        report.features.feedback_creation.status = 'failed';
        report.features.feedback_creation.issues.push('Feedback creation verification failed');
      }

      // Cleanup test feedback
      await client.query(
        'DELETE FROM enterprise_feedback WHERE feedback_id = $1',
        [feedbackResult.rows[0].feedback_id]
      );
    } catch (error) {
      report.features.feedback_creation.status = 'failed';
      report.features.feedback_creation.issues.push(error.message);
    }

    // Test Feature 3: Activity Logging
    console.log('Testing Activity Logging...');
    report.features.activity_logging = { status: 'testing', issues: [] };
    try {
      const testActivity = {
        activity_type: 'TEST',
        entity_type: 'VENDOR',
        entity_id: 1,
        description: 'Test activity'
      };

      const activityResult = await client.query(`
        INSERT INTO activities 
        (activity_type, entity_type, entity_id, description) 
        VALUES ($1, $2, $3, $4)
        RETURNING activity_id`,
        [testActivity.activity_type, testActivity.entity_type, 
         testActivity.entity_id, testActivity.description]
      );

      // Verify activity was created
      const activityCheck = await client.query(
        'SELECT * FROM activities WHERE activity_id = $1',
        [activityResult.rows[0].activity_id]
      );

      if (activityCheck.rows.length === 1) {
        report.features.activity_logging.status = 'passed';
      } else {
        report.features.activity_logging.status = 'failed';
        report.features.activity_logging.issues.push('Activity logging verification failed');
      }

      // Cleanup test activity
      await client.query(
        'DELETE FROM activities WHERE activity_id = $1',
        [activityResult.rows[0].activity_id]
      );
    } catch (error) {
      report.features.activity_logging.status = 'failed';
      report.features.activity_logging.issues.push(error.message);
    }

    // Update summary
    report.summary.total_features = Object.keys(report.features).length;
    report.summary.passed_features = Object.values(report.features)
      .filter(f => f.status === 'passed').length;
    report.summary.failed_features = report.summary.total_features - 
      report.summary.passed_features;

    // Generate report file
    const fs = require('fs');
    const reportPath = './feature-validation-report.md';
    
    let reportContent = '# Feature Validation Report\n\n';
    reportContent += `## Summary\n\n`;
    reportContent += `- Total features tested: ${report.summary.total_features}\n`;
    reportContent += `- Features passed: ${report.summary.passed_features}\n`;
    reportContent += `- Features failed: ${report.summary.failed_features}\n\n`;

    reportContent += `## Feature Details\n\n`;
    Object.entries(report.features).forEach(([featureName, details]) => {
      reportContent += `### ${featureName.replace(/_/g, ' ').toUpperCase()}\n\n`;
      reportContent += `Status: ${details.status}\n\n`;
      if (details.issues.length > 0) {
        reportContent += `Issues:\n`;
        details.issues.forEach(issue => {
          reportContent += `- ${issue}\n`;
        });
      } else {
        reportContent += `No issues found.\n`;
      }
      reportContent += '\n';
    });

    fs.writeFileSync(reportPath, reportContent);
    console.log(`\nValidation report generated: ${reportPath}`);

  } catch (error) {
    console.error('Error during feature validation:', error);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
    return report;
  }
}

// Run the validation
validateFeatures().catch(console.error); 