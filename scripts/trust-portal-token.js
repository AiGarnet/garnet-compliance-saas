const { Client } = require('pg');
const crypto = require('crypto');

// Database connection configuration
const config = {
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: {
    rejectUnauthorized: false
  }
};

class TrustPortalTokenManager {
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

  // Generate a new invite token for a vendor
  async generateInviteToken(vendorId) {
    try {
      // First check if vendor exists
      const vendorCheck = await this.client.query(
        'SELECT vendor_id, company_name FROM vendors WHERE vendor_id = $1',
        [vendorId]
      );

      if (vendorCheck.rows.length === 0) {
        throw new Error(`Vendor with ID ${vendorId} not found`);
      }

      // Generate a random token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Set expiration to 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Deactivate any existing active tokens for this vendor
      await this.client.query(
        'UPDATE vendor_invite_tokens SET is_active = false WHERE vendor_id = $1 AND is_active = true',
        [vendorId]
      );

      // Insert new token
      const result = await this.client.query(
        `INSERT INTO vendor_invite_tokens (vendor_id, token, expires_at)
         VALUES ($1, $2, $3)
         RETURNING token_id, token, expires_at, is_active`,
        [vendorId, token, expiresAt]
      );

      return {
        tokenId: result.rows[0].token_id,
        token: result.rows[0].token,
        expiresAt: result.rows[0].expires_at,
        isActive: result.rows[0].is_active,
        vendorName: vendorCheck.rows[0].company_name
      };
    } catch (error) {
      console.error('Error generating invite token:', error);
      throw error;
    }
  }

  // Validate and use an invite token
  async validateToken(token) {
    try {
      // Get token details and update last_accessed_at
      const result = await this.client.query(
        `UPDATE vendor_invite_tokens 
         SET last_accessed_at = CURRENT_TIMESTAMP
         WHERE token = $1 
         AND is_active = true 
         AND expires_at > CURRENT_TIMESTAMP
         RETURNING token_id, vendor_id, expires_at`,
        [token]
      );

      if (result.rows.length === 0) {
        return { valid: false, message: 'Invalid or expired token' };
      }

      // Get vendor details
      const vendorResult = await this.client.query(
        'SELECT vendor_id, company_name, status FROM vendors WHERE vendor_id = $1',
        [result.rows[0].vendor_id]
      );

      if (vendorResult.rows.length === 0) {
        return { valid: false, message: 'Vendor not found' };
      }

      return {
        valid: true,
        tokenId: result.rows[0].token_id,
        vendorId: result.rows[0].vendor_id,
        vendorName: vendorResult.rows[0].company_name,
        expiresAt: result.rows[0].expires_at
      };
    } catch (error) {
      console.error('Error validating token:', error);
      throw error;
    }
  }

  // Get all active tokens for a vendor
  async getVendorTokens(vendorId) {
    try {
      const result = await this.client.query(
        `SELECT token_id, token, created_at, expires_at, last_accessed_at, is_active 
         FROM vendor_invite_tokens 
         WHERE vendor_id = $1 
         AND is_active = true 
         ORDER BY created_at DESC`,
        [vendorId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting vendor tokens:', error);
      throw error;
    }
  }

  // Deactivate a specific token
  async deactivateToken(token) {
    try {
      const result = await this.client.query(
        'UPDATE vendor_invite_tokens SET is_active = false WHERE token = $1 RETURNING token_id, token, expires_at',
        [token]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error deactivating token:', error);
      throw error;
    }
  }
}

// Export the class
module.exports = TrustPortalTokenManager;

// Example usage:
async function example() {
  const tokenManager = new TrustPortalTokenManager();
  
  try {
    await tokenManager.connect();

    // Generate a new token
    const vendorId = 1; // Example vendor ID
    const newToken = await tokenManager.generateInviteToken(vendorId);
    console.log('Generated token:', newToken);

    // Validate the token
    const validation = await tokenManager.validateToken(newToken.token);
    console.log('Token validation:', validation);

    // Get vendor tokens
    const tokens = await tokenManager.getVendorTokens(vendorId);
    console.log('Vendor tokens:', tokens);

  } catch (error) {
    console.error('Error in example:', error);
  } finally {
    await tokenManager.disconnect();
  }
}

// Uncomment to run example:
// example().catch(console.error); 