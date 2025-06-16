import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateVendorDto, UpdateVendorDto, VendorQuestionnaireAnswerDto, CreateVendorWithAnswersDto } from './dto/vendor.dto';
import { Vendor, VendorStatus, RiskLevel, QuestionnaireAnswer } from './entities/vendor.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VendorsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get all vendors
   */
  async getAllVendors(): Promise<Vendor[]> {
    const query = `
      SELECT 
        vendor_id as "vendorId",
        uuid,
        company_name as "companyName",
        region,
        status,
        risk_score as "riskScore",
        risk_level as "riskLevel",
        contact_name as "contactName",
        contact_email as "contactEmail",
        website,
        industry,
        description,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM vendors 
      ORDER BY created_at DESC
    `;
    
    const result = await this.databaseService.query(query);
    return result.rows.map(row => ({
      ...row,
      // Legacy compatibility
      id: row.vendorId.toString(),
      name: row.companyName
    }));
  }

  /**
   * Get a vendor by ID
   */
  async getVendorById(id: string): Promise<Vendor | null> {
    // Check if the ID is a number (vendor_id) or UUID
    const isNumericId = /^\d+$/.test(id);
    
    let query: string;
    if (isNumericId) {
      // If it's numeric, search by vendor_id
      query = `
        SELECT 
          vendor_id as "vendorId",
          uuid,
          company_name as "companyName",
          region,
          status,
          risk_score as "riskScore",
          risk_level as "riskLevel",
          contact_name as "contactName",
          contact_email as "contactEmail",
          website,
          industry,
          description,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM vendors 
        WHERE vendor_id = $1
      `;
    } else {
      // If it's not numeric, search by UUID
      query = `
        SELECT 
          vendor_id as "vendorId",
          uuid,
          company_name as "companyName",
          region,
          status,
          risk_score as "riskScore",
          risk_level as "riskLevel",
          contact_name as "contactName",
          contact_email as "contactEmail",
          website,
          industry,
          description,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM vendors 
        WHERE uuid = $1
      `;
    }
    
    const result = await this.databaseService.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const vendor = result.rows[0];
    
    // Get questionnaire answers
    const answersQuery = `
      SELECT 
        id,
        vendor_id as "vendorId",
        question_id as "questionId",
        question,
        answer,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM questionnaire_answers 
      WHERE vendor_id = $1
    `;
    
    const answersResult = await this.databaseService.query(answersQuery, [vendor.vendorId]);
    
    return {
      ...vendor,
      questionnaireAnswers: answersResult.rows,
      // Legacy compatibility
      id: vendor.vendorId.toString(),
      name: vendor.companyName
    };
  }

  /**
   * Create a new vendor
   */
  async createVendor(createVendorDto: CreateVendorDto): Promise<Vendor> {
    const {
      companyName,
      region,
      contactEmail,
      status = VendorStatus.QUESTIONNAIRE_PENDING,
      riskScore = 0,
      riskLevel = RiskLevel.MEDIUM,
      contactName,
      website,
      industry,
      description
    } = createVendorDto;

    const uuid = uuidv4();
    
    const query = `
      INSERT INTO vendors (
        uuid, company_name, region, status, risk_score, risk_level,
        contact_name, contact_email, website, industry, description,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
      ) RETURNING 
        vendor_id as "vendorId",
        uuid,
        company_name as "companyName",
        region,
        status,
        risk_score as "riskScore",
        risk_level as "riskLevel",
        contact_name as "contactName",
        contact_email as "contactEmail",
        website,
        industry,
        description,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;
    
    const values = [
      uuid, companyName, region, status, riskScore, riskLevel,
      contactName, contactEmail, website, industry, description
    ];
    
    const result = await this.databaseService.query(query, values);
    const vendor = result.rows[0];
    
    return {
      ...vendor,
      questionnaireAnswers: [],
      // Legacy compatibility
      id: vendor.vendorId.toString(),
      name: vendor.companyName
    };
  }

  /**
   * Update a vendor
   */
  async updateVendor(id: string, updateVendorDto: UpdateVendorDto): Promise<Vendor | null> {
    const existingVendor = await this.getVendorById(id);
    if (!existingVendor) {
      return null;
    }

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updateVendorDto).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = this.camelToSnake(key);
        updateFields.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return existingVendor;
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(existingVendor.vendorId);

    const query = `
      UPDATE vendors 
      SET ${updateFields.join(', ')}
      WHERE vendor_id = $${paramIndex}
      RETURNING 
        vendor_id as "vendorId",
        uuid,
        company_name as "companyName",
        region,
        status,
        risk_score as "riskScore",
        risk_level as "riskLevel",
        contact_name as "contactName",
        contact_email as "contactEmail",
        website,
        industry,
        description,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;
    
    const result = await this.databaseService.query(query, values);
    const vendor = result.rows[0];
    
    return {
      ...vendor,
      questionnaireAnswers: existingVendor.questionnaireAnswers || [],
      // Legacy compatibility
      id: vendor.vendorId.toString(),
      name: vendor.companyName
    };
  }

  /**
   * Delete a vendor
   */
  async deleteVendor(id: string): Promise<boolean> {
    // Check if the ID is a number (vendor_id) or UUID
    const isNumericId = /^\d+$/.test(id);
    
    let query: string;
    if (isNumericId) {
      query = `DELETE FROM vendors WHERE vendor_id = $1`;
    } else {
      query = `DELETE FROM vendors WHERE uuid = $1`;
    }
    
    const result = await this.databaseService.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Get vendors by status
   */
  async getVendorsByStatus(status: VendorStatus): Promise<Vendor[]> {
    const query = `
      SELECT 
        vendor_id as "vendorId",
        uuid,
        company_name as "companyName",
        region,
        status,
        risk_score as "riskScore",
        risk_level as "riskLevel",
        contact_name as "contactName",
        contact_email as "contactEmail",
        website,
        industry,
        description,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM vendors 
      WHERE status = $1
      ORDER BY created_at DESC
    `;
    
    const result = await this.databaseService.query(query, [status]);
    return result.rows.map(row => ({
      ...row,
      // Legacy compatibility
      id: row.vendorId.toString(),
      name: row.companyName
    }));
  }

  /**
   * Get vendors with AI suggestions
   */
  async getVendorsWithSuggestions(): Promise<Vendor[]> {
    const query = `
      SELECT DISTINCT
        v.vendor_id as "vendorId",
        v.uuid,
        v.company_name as "companyName",
        v.region,
        v.status,
        v.risk_score as "riskScore",
        v.risk_level as "riskLevel",
        v.contact_name as "contactName",
        v.contact_email as "contactEmail",
        v.website,
        v.industry,
        v.description,
        v.created_at as "createdAt",
        v.updated_at as "updatedAt",
        true as "hasSuggestions"
      FROM vendors v
      INNER JOIN ai_suggestions s ON v.vendor_id = s.vendor_id
      ORDER BY v.created_at DESC
    `;
    
    const result = await this.databaseService.query(query);
    return result.rows.map(row => ({
      ...row,
      // Legacy compatibility
      id: row.vendorId.toString(),
      name: row.companyName
    }));
  }

  /**
   * Save questionnaire answers for a vendor
   */
  async saveVendorQuestionnaireAnswers(vendorId: string, answers: VendorQuestionnaireAnswerDto[]): Promise<QuestionnaireAnswer[]> {
    const vendor = await this.getVendorById(vendorId);
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    const savedAnswers: QuestionnaireAnswer[] = [];

    for (const answer of answers) {
      const query = `
        INSERT INTO questionnaire_answers (
          id, vendor_id, question_id, question, answer, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, NOW(), NOW()
        ) ON CONFLICT (vendor_id, question_id) 
        DO UPDATE SET 
          question = EXCLUDED.question,
          answer = EXCLUDED.answer,
          updated_at = NOW()
        RETURNING 
          id,
          vendor_id as "vendorId",
          question_id as "questionId",
          question,
          answer,
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;
      
      const answerId = uuidv4();
      const values = [answerId, vendor.vendorId, answer.questionId, answer.question, answer.answer];
      
      const result = await this.databaseService.query(query, values);
      savedAnswers.push(result.rows[0]);
    }

    return savedAnswers;
  }

  /**
   * Create a vendor with questionnaire answers
   */
  async createVendorWithAnswers(createVendorWithAnswersDto: CreateVendorWithAnswersDto): Promise<Vendor> {
    const { answers, ...vendorData } = createVendorWithAnswersDto;
    
    // Create the vendor first
    const vendor = await this.createVendor(vendorData);
    
    // Save the questionnaire answers
    if (answers && answers.length > 0) {
      const savedAnswers = await this.saveVendorQuestionnaireAnswers(vendor.vendorId.toString(), answers);
      vendor.questionnaireAnswers = savedAnswers;
    }
    
    return vendor;
  }

  /**
   * Get vendor statistics
   */
  async getVendorStats(): Promise<any> {
    const totalQuery = `SELECT COUNT(*) as total FROM vendors`;
    const statusQuery = `
      SELECT status, COUNT(*) as count 
      FROM vendors 
      GROUP BY status
    `;
    const riskQuery = `
      SELECT risk_level as "riskLevel", COUNT(*) as count 
      FROM vendors 
      GROUP BY risk_level
    `;
    
    const [totalResult, statusResult, riskResult] = await Promise.all([
      this.databaseService.query(totalQuery),
      this.databaseService.query(statusQuery),
      this.databaseService.query(riskQuery)
    ]);
    
    const statusCounts = {};
    statusResult.rows.forEach(row => {
      statusCounts[row.status] = parseInt(row.count);
    });
    
    const riskCounts = {};
    riskResult.rows.forEach(row => {
      riskCounts[row.riskLevel] = parseInt(row.count);
    });
    
    return {
      total: parseInt(totalResult.rows[0].total),
      byStatus: statusCounts,
      byRiskLevel: riskCounts
    };
  }

  /**
   * Helper method to convert camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
} 