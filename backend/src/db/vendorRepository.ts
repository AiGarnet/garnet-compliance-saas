import pool from '../config/database';
import { Vendor, QuestionnaireAnswer, VendorStatus, RiskLevel } from '../types/vendor';

export class VendorRepository {
  /**
   * Get all vendors from the database
   */
  async getAllVendors(): Promise<Vendor[]> {
    const query = `
      SELECT * FROM vendors
      ORDER BY name ASC
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
      ORDER BY name ASC
    `;
    
    const result = await pool.query(query, [status]);
    return this.mapVendorsWithAnswers(result.rows);
  }
  
  /**
   * Get a vendor by ID with all questionnaire answers
   */
  async getVendorById(id: string): Promise<Vendor | null> {
    const query = `
      SELECT * FROM vendors
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const vendors = await this.mapVendorsWithAnswers([result.rows[0]]);
    return vendors[0];
  }
  
  /**
   * Create a new vendor
   */
  async createVendor(vendor: Omit<Vendor, 'id' | 'questionnaireAnswers' | 'createdAt' | 'updatedAt'>): Promise<Vendor> {
    const query = `
      INSERT INTO vendors (name, status, risk_score, risk_level, contact_name, contact_email, website, industry, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      vendor.name,
      vendor.status,
      vendor.riskScore,
      vendor.riskLevel,
      vendor.contactName || null,
      vendor.contactEmail || null,
      vendor.website || null,
      vendor.industry || null,
      vendor.description || null
    ];
    
    const result = await pool.query(query, values);
    return {
      ...result.rows[0],
      id: result.rows[0].id,
      name: result.rows[0].name,
      status: result.rows[0].status as VendorStatus,
      riskScore: result.rows[0].risk_score,
      riskLevel: result.rows[0].risk_level as RiskLevel,
      contactName: result.rows[0].contact_name,
      contactEmail: result.rows[0].contact_email,
      website: result.rows[0].website,
      industry: result.rows[0].industry,
      description: result.rows[0].description,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
      questionnaireAnswers: []
    };
  }
  
  /**
   * Update a vendor
   */
  async updateVendor(id: string, vendor: Partial<Vendor>): Promise<Vendor | null> {
    // Start building the query
    let query = 'UPDATE vendors SET ';
    const values: any[] = [];
    const setClauses: string[] = [];
    let paramIndex = 1;
    
    // Add fields that need to be updated
    if (vendor.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(vendor.name);
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
    
    if (vendor.contactEmail !== undefined) {
      setClauses.push(`contact_email = $${paramIndex++}`);
      values.push(vendor.contactEmail);
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
      return this.getVendorById(id);
    }
    
    // Complete the query
    query += setClauses.join(', ');
    query += ` WHERE id = $${paramIndex} RETURNING *`;
    values.push(id);
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.getVendorById(id);
  }
  
  /**
   * Delete a vendor
   */
  async deleteVendor(id: string): Promise<boolean> {
    const query = `
      DELETE FROM vendors
      WHERE id = $1
      RETURNING id
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  }
  
  /**
   * Save questionnaire answers for a vendor
   */
  async saveVendorQuestionnaireAnswers(
    vendorId: string,
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
          VALUES
            ($1, $2, $3, $4)
          ON CONFLICT (vendor_id, question_id)
          DO UPDATE SET
            question = $3,
            answer = $4,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `;
        
        const values = [
          vendorId,
          answer.questionId,
          answer.question,
          answer.answer
        ];
        
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
      
      // Update vendor status to IN_REVIEW if it has answers now
      if (answers.length > 0) {
        const updateVendorQuery = `
          UPDATE vendors
          SET status = $1
          WHERE id = $2 AND status = $3
        `;
        
        await client.query(updateVendorQuery, [
          VendorStatus.IN_REVIEW,
          vendorId,
          VendorStatus.QUESTIONNAIRE_PENDING
        ]);
      }
      
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
  async getVendorQuestionnaireAnswers(vendorId: string): Promise<QuestionnaireAnswer[]> {
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
   * Helper method to map database rows to Vendor objects with answers
   */
  private async mapVendorsWithAnswers(rows: any[]): Promise<Vendor[]> {
    const vendors: Vendor[] = [];
    
    for (const row of rows) {
      const answers = await this.getVendorQuestionnaireAnswers(row.id);
      
      vendors.push({
        id: row.id,
        name: row.name,
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
        questionnaireAnswers: answers
      });
    }
    
    return vendors;
  }
} 