import pool from '../config/database';
import { Vendor, QuestionnaireAnswer, VendorStatus, RiskLevel, CreateVendorRequest, UpdateVendorRequest } from '../types/vendor';

export class VendorRepository {
  /**
   * Get all vendors from the database
   */
  async getAllVendors(): Promise<Vendor[]> {
    const query = `
      SELECT * FROM vendors
      ORDER BY company_name ASC
    `;
    
    const result = await pool.query(query);
    return this.mapVendorsWithAnswers(result.rows);
  }
  
  /**
   * Get vendors by status
   */
  async getVendorsByStatus(status: VendorStatus): Promise<Vendor[]> {
    const query = `
      SELECT * FROM vendors
      WHERE status = $1
      ORDER BY company_name ASC
    `;
    
    const result = await pool.query(query, [status]);
    return this.mapVendorsWithAnswers(result.rows);
  }

  /**
   * Get vendors with AI suggestions
   */
  async getVendorsWithSuggestions(): Promise<Vendor[]> {
    const query = `
      SELECT * FROM vendors
      WHERE has_suggestions = TRUE
      ORDER BY company_name ASC
    `;
    
    const result = await pool.query(query);
    return this.mapVendorsWithAnswers(result.rows);
  }
  
  /**
   * Get a vendor by ID with all questionnaire answers
   */
  async getVendorById(vendorId: number): Promise<Vendor | null> {
    const query = `
      SELECT * FROM vendors
      WHERE vendor_id = $1
    `;
    
    const result = await pool.query(query, [vendorId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const vendors = await this.mapVendorsWithAnswers([result.rows[0]]);
    return vendors[0];
  }
  
  /**
   * Get a vendor by UUID for backward compatibility
   */
  async getVendorByUuid(uuid: string): Promise<Vendor | null> {
    const query = `
      SELECT * FROM vendors
      WHERE uuid = $1
    `;
    
    const result = await pool.query(query, [uuid]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const vendors = await this.mapVendorsWithAnswers([result.rows[0]]);
    return vendors[0];
  }
  
  /**
   * Create a new vendor
   */
  async createVendor(vendor: CreateVendorRequest): Promise<Vendor> {
    const query = `
      INSERT INTO vendors (company_name, region, contact_email, status, risk_score, risk_level, contact_name, website, industry, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      vendor.companyName,
      vendor.region,
      vendor.contactEmail,
      vendor.status || 'Questionnaire Pending',
      vendor.riskScore || 50,
      vendor.riskLevel || 'Medium',
      vendor.contactName || null,
      vendor.website || null,
      vendor.industry || null,
      vendor.description || null
    ];
    
    const result = await pool.query(query, values);
    return this.mapRowToVendor(result.rows[0], []);
  }
  
  /**
   * Update a vendor
   */
  async updateVendor(vendorId: number, vendor: Partial<UpdateVendorRequest>): Promise<Vendor | null> {
    // Start building the query
    let query = 'UPDATE vendors SET ';
    const values: any[] = [];
    const setClauses: string[] = [];
    let paramIndex = 1;
    
    // Add fields that need to be updated
    if (vendor.companyName !== undefined) {
      setClauses.push(`company_name = $${paramIndex++}`);
      values.push(vendor.companyName);
    }
    
    if (vendor.region !== undefined) {
      setClauses.push(`region = $${paramIndex++}`);
      values.push(vendor.region);
    }
    
    if (vendor.contactEmail !== undefined) {
      setClauses.push(`contact_email = $${paramIndex++}`);
      values.push(vendor.contactEmail);
    }
    
    if (vendor.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(vendor.status);
    }
    
    if (vendor.riskScore !== undefined) {
      setClauses.push(`risk_score = $${paramIndex++}`);
      values.push(vendor.riskScore);
    }
    
    if (vendor.riskLevel !== undefined) {
      setClauses.push(`risk_level = $${paramIndex++}`);
      values.push(vendor.riskLevel);
    }
    
    if (vendor.contactName !== undefined) {
      setClauses.push(`contact_name = $${paramIndex++}`);
      values.push(vendor.contactName);
    }
    
    if (vendor.website !== undefined) {
      setClauses.push(`website = $${paramIndex++}`);
      values.push(vendor.website);
    }
    
    if (vendor.industry !== undefined) {
      setClauses.push(`industry = $${paramIndex++}`);
      values.push(vendor.industry);
    }
    
    if (vendor.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(vendor.description);
    }
    
    // If no fields to update
    if (setClauses.length === 0) {
      return this.getVendorById(vendorId);
    }
    
    // Complete the query
    query += setClauses.join(', ');
    query += ` WHERE vendor_id = $${paramIndex} RETURNING *`;
    values.push(vendorId);
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.getVendorById(vendorId);
  }
  
  /**
   * Delete a vendor
   */
  async deleteVendor(vendorId: number): Promise<boolean> {
    const query = `
      DELETE FROM vendors
      WHERE vendor_id = $1
      RETURNING vendor_id
    `;
    
    const result = await pool.query(query, [vendorId]);
    return result.rows.length > 0;
  }
  
  /**
   * Save questionnaire answers for a vendor
   */
  async saveVendorQuestionnaireAnswers(
    vendorId: number,
    answers: Omit<QuestionnaireAnswer, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<QuestionnaireAnswer[]> {
    // Begin transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const savedAnswers: QuestionnaireAnswer[] = [];
      
      // Process each answer
      for (const answer of answers) {
        const upsertQuery = `
          INSERT INTO vendor_questionnaire_answers
            (vendor_id, question_id, question, answer)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (vendor_id, question_id)
          DO UPDATE SET
            question = EXCLUDED.question,
            answer = EXCLUDED.answer,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `;
        
        const values = [vendorId, answer.questionId, answer.question, answer.answer];
        const result = await client.query(upsertQuery, values);
        
        savedAnswers.push({
          id: result.rows[0].id,
          vendorId: result.rows[0].vendor_id,
          questionId: result.rows[0].question_id,
          question: result.rows[0].question,
          answer: result.rows[0].answer,
          createdAt: result.rows[0].created_at,
          updatedAt: result.rows[0].updated_at
        });
      }
      
      // Update has_suggestions flag to true since answers have been saved
      await client.query(`
        UPDATE vendors 
        SET has_suggestions = TRUE, updated_at = CURRENT_TIMESTAMP 
        WHERE vendor_id = $1
      `, [vendorId]);
      
      await client.query('COMMIT');
      return savedAnswers;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get questionnaire answers for a vendor
   */
  async getVendorQuestionnaireAnswers(vendorId: number): Promise<QuestionnaireAnswer[]> {
    const query = `
      SELECT * FROM vendor_questionnaire_answers
      WHERE vendor_id = $1
      ORDER BY created_at ASC
    `;
    
    const result = await pool.query(query, [vendorId]);
    
    return result.rows.map(row => ({
      id: row.id,
      vendorId: row.vendor_id,
      questionId: row.question_id,
      question: row.question,
      answer: row.answer,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }
  
  /**
   * Map database rows to vendors with their answers
   */
  private async mapVendorsWithAnswers(rows: any[]): Promise<Vendor[]> {
    const vendors: Vendor[] = [];
    
    for (const row of rows) {
      const answers = await this.getVendorQuestionnaireAnswers(row.vendor_id);
      vendors.push(this.mapRowToVendor(row, answers));
    }
    
    return vendors;
  }
  
  /**
   * Map a single database row to a Vendor object
   */
  private mapRowToVendor(row: any, answers: QuestionnaireAnswer[]): Vendor {
    return {
      vendorId: row.vendor_id,
      uuid: row.uuid,
      companyName: row.company_name,
      region: row.region,
      status: row.status as VendorStatus,
      riskScore: row.risk_score,
      riskLevel: row.risk_level as RiskLevel,
      contactName: row.contact_name,
      contactEmail: row.contact_email,
      website: row.website,
      industry: row.industry,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      questionnaireAnswers: answers,
      hasSuggestions: row.has_suggestions || false,
      
      // Backward compatibility
      id: row.uuid, // Map UUID to old id field
      name: row.company_name // Map company_name to old name field
    };
  }
} 