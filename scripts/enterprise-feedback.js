const { Client } = require('pg');

// Database connection configuration
const config = {
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: {
    rejectUnauthorized: false
  }
};

class EnterpriseFeedbackManager {
  constructor() {
    this.client = new Client(config);
  }

  async connect() {
    await this.client.connect();
    console.log('Connected to database');
  }

  async disconnect() {
    await this.client.end();
    console.log('Database connection closed');
  }

  // Create new feedback
  async createFeedback(data) {
    try {
      const result = await this.client.query(
        `INSERT INTO enterprise_feedback 
         (vendor_id, enterprise_name, feedback_text, rating, is_public)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [data.vendorId, data.enterpriseName, data.feedbackText, data.rating, data.isPublic || false]
      );

      // Create activity log entry
      await this.client.query(
        `INSERT INTO activities 
         (user_id, activity_type, entity_type, entity_id, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          null, // no user_id for enterprise feedback
          'FEEDBACK_CREATED',
          'VENDOR',
          data.vendorId,
          `New feedback received from ${data.enterpriseName}`
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw error;
    }
  }

  // Get all feedback for a vendor
  async getVendorFeedback(vendorId) {
    try {
      const result = await this.client.query(
        `SELECT * FROM enterprise_feedback 
         WHERE vendor_id = $1 
         AND status = 'active'
         ORDER BY created_at DESC`,
        [vendorId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting vendor feedback:', error);
      throw error;
    }
  }

  // Get feedback for dashboard (founder and sales)
  async getDashboardFeedback(vendorId) {
    try {
      const result = await this.client.query(
        `SELECT 
           ef.*,
           v.name as vendor_name,
           ROUND(AVG(ef.rating) OVER (PARTITION BY ef.vendor_id), 2) as avg_rating,
           COUNT(*) OVER (PARTITION BY ef.vendor_id) as total_feedback
         FROM enterprise_feedback ef
         JOIN vendors v ON v.id = ef.vendor_id
         WHERE ef.vendor_id = $1 
         AND ef.status = 'active'
         ORDER BY ef.created_at DESC`,
        [vendorId]
      );

      return {
        feedback: result.rows,
        summary: {
          averageRating: result.rows[0]?.avg_rating || 0,
          totalFeedback: result.rows[0]?.total_feedback || 0,
          vendorName: result.rows[0]?.vendor_name
        }
      };
    } catch (error) {
      console.error('Error getting dashboard feedback:', error);
      throw error;
    }
  }

  // Update feedback status
  async updateFeedbackStatus(feedbackId, status) {
    try {
      const result = await this.client.query(
        `UPDATE enterprise_feedback 
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [status, feedbackId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error updating feedback status:', error);
      throw error;
    }
  }

  // Toggle feedback public visibility
  async toggleFeedbackVisibility(feedbackId) {
    try {
      const result = await this.client.query(
        `UPDATE enterprise_feedback 
         SET is_public = NOT is_public, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [feedbackId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error toggling feedback visibility:', error);
      throw error;
    }
  }

  // Get public feedback for trust portal
  async getPublicFeedback(vendorId) {
    try {
      const result = await this.client.query(
        `SELECT 
           id,
           enterprise_name,
           feedback_text,
           rating,
           created_at
         FROM enterprise_feedback 
         WHERE vendor_id = $1 
         AND status = 'active'
         AND is_public = true
         ORDER BY created_at DESC`,
        [vendorId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting public feedback:', error);
      throw error;
    }
  }
}

// Export the class
module.exports = EnterpriseFeedbackManager;

// Example usage:
async function example() {
  const feedbackManager = new EnterpriseFeedbackManager();
  
  try {
    await feedbackManager.connect();

    // Create new feedback
    const newFeedback = await feedbackManager.createFeedback({
      vendorId: 1,
      enterpriseName: 'Example Enterprise',
      feedbackText: 'Great vendor experience!',
      rating: 5,
      isPublic: true
    });
    console.log('Created feedback:', newFeedback);

    // Get vendor feedback
    const feedback = await feedbackManager.getVendorFeedback(1);
    console.log('Vendor feedback:', feedback);

    // Get dashboard feedback
    const dashboardFeedback = await feedbackManager.getDashboardFeedback(1);
    console.log('Dashboard feedback:', dashboardFeedback);

  } catch (error) {
    console.error('Error in example:', error);
  } finally {
    await feedbackManager.disconnect();
  }
}

// Uncomment to run example:
// example().catch(console.error); 