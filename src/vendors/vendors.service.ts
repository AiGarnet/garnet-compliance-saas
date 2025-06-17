import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateVendorDto, UpdateVendorDto, VendorQuestionnaireAnswerDto, CreateVendorWithAnswersDto, CreateVendorWorkDto, UpdateVendorWorkDto, ShareToTrustPortalDto } from './dto/vendor.dto';
import { Vendor, VendorStatus, RiskLevel, QuestionnaireAnswer, VendorWork, WorkStatus } from './entities/vendor.entity';
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
    
    // Get questionnaire answers from vendor_questionnaire_answers table
    let questionnaireAnswers = [];
    try {
      const answersQuery = `
        SELECT 
          id,
          vendor_id as "vendorId",
          question_id as "questionId",
          question,
          answer,
          status,
          share_to_trust_portal as "shareToTrustPortal",
          work_id as "workId",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM vendor_questionnaire_answers 
        WHERE vendor_id = $1
        ORDER BY created_at DESC
      `;
      
      const answersResult = await this.databaseService.query(answersQuery, [vendor.vendorId]);
      questionnaireAnswers = answersResult.rows;
    } catch (error) {
      // If vendor_questionnaire_answers table query fails, use empty array
      console.warn('vendor_questionnaire_answers table query failed:', error.message);
      questionnaireAnswers = [];
    }
    
    return {
      ...vendor,
      questionnaireAnswers,
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
        INSERT INTO vendor_questionnaire_answers (
          id, vendor_id, question_id, question, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, NOW(), NOW()
        ) ON CONFLICT (vendor_id, question_id) 
        DO UPDATE SET 
          question = EXCLUDED.question,
          updated_at = NOW()
        RETURNING 
          id,
          vendor_id as "vendorId",
          question_id as "questionId",
          question,
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;
      
      const answerId = uuidv4();
      const values = [answerId, vendor.vendorId, answer.questionId, answer.question];
      
      const result = await this.databaseService.query(query, values);
      // Add answer field for compatibility
      const savedAnswer = {
        ...result.rows[0],
        answer: answer.answer || '' // Include the answer from the DTO
      };
      savedAnswers.push(savedAnswer);
    }

    return savedAnswers;
  }

  /**
   * Get questionnaire answers for a vendor
   */
  async getVendorQuestionnaireAnswers(vendorId: string): Promise<QuestionnaireAnswer[]> {
    const vendor = await this.getVendorById(vendorId);
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    const query = `
      SELECT 
        id,
        vendor_id as "vendorId",
        question_id as "questionId",
        question,
        answer,
        status,
        share_to_trust_portal as "shareToTrustPortal",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM vendor_questionnaire_answers 
      WHERE vendor_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await this.databaseService.query(query, [vendor.vendorId]);
    return result.rows;
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

  /**
   * Create a new vendor work submission
   */
  async createVendorWork(vendorId: string, createVendorWorkDto: CreateVendorWorkDto): Promise<VendorWork> {
    const {
      projectName,
      description,
      status,
      startDate,
      endDate,
      clientName,
      technologies,
      category,
      shareToTrustPortal,
      evidenceFiles,
      questionnaireAnswers,
      isDraft = false
    } = createVendorWorkDto;

    const workId = uuidv4();
    const now = new Date();
    
    // Verify vendor exists
    const vendor = await this.getVendorById(vendorId);
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    const query = `
      INSERT INTO vendor_works (
        id, vendor_id, project_name, description, status, start_date, end_date,
        client_name, technologies, category, share_to_trust_portal, evidence_files,
        questionnaire_answers, is_draft, created_at, updated_at, last_saved_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      ) RETURNING 
        id,
        vendor_id as "vendorId",
        project_name as "projectName",
        description,
        status,
        start_date as "startDate",
        end_date as "endDate",
        client_name as "clientName",
        technologies,
        category,
        share_to_trust_portal as "shareToTrustPortal",
        evidence_files as "evidenceFiles",
        questionnaire_answers as "questionnaireAnswers",
        is_draft as "isDraft",
        created_at as "createdAt",
        updated_at as "updatedAt",
        last_saved_at as "lastSavedAt"
    `;
    
    const values = [
      workId, vendor.vendorId, projectName, description, status,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null,
      clientName,
      JSON.stringify(technologies || []),
      category,
      shareToTrustPortal,
      JSON.stringify(evidenceFiles || []),
      JSON.stringify(questionnaireAnswers || []),
      isDraft,
      now, now, now
    ];
    
    const result = await this.databaseService.query(query, values);
    const work = result.rows[0];
    
    // Parse JSON fields
    work.technologies = JSON.parse(work.technologies || '[]');
    work.evidenceFiles = JSON.parse(work.evidenceFiles || '[]');
    work.questionnaireAnswers = JSON.parse(work.questionnaireAnswers || '[]');
    
    return work;
  }

  /**
   * Update vendor work submission
   */
  async updateVendorWork(vendorId: string, workId: string, updateVendorWorkDto: UpdateVendorWorkDto): Promise<VendorWork | null> {
    // Verify vendor exists and owns the work
    const vendor = await this.getVendorById(vendorId);
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    const existingWork = await this.getVendorWorkById(vendorId, workId);
    if (!existingWork) {
      throw new NotFoundException(`Work with ID ${workId} not found for vendor ${vendorId}`);
    }

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic update query
    Object.entries(updateVendorWorkDto).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = this.camelToSnake(key);
        if (['technologies', 'evidenceFiles', 'questionnaireAnswers'].includes(key)) {
          updateFields.push(`${dbField} = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else if (['startDate', 'endDate'].includes(key)) {
          updateFields.push(`${dbField} = $${paramIndex}`);
          values.push(value ? new Date(value) : null);
        } else {
          updateFields.push(`${dbField} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return existingWork;
    }

    // Always update last_saved_at and updated_at
    updateFields.push(`last_saved_at = $${paramIndex}`, `updated_at = $${paramIndex + 1}`);
    values.push(new Date(), new Date());
    paramIndex += 2;

    const query = `
      UPDATE vendor_works 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND vendor_id = $${paramIndex + 1}
      RETURNING 
        id,
        vendor_id as "vendorId",
        project_name as "projectName",
        description,
        status,
        start_date as "startDate",
        end_date as "endDate",
        client_name as "clientName",
        technologies,
        category,
        share_to_trust_portal as "shareToTrustPortal",
        evidence_files as "evidenceFiles",
        questionnaire_answers as "questionnaireAnswers",
        is_draft as "isDraft",
        created_at as "createdAt",
        updated_at as "updatedAt",
        last_saved_at as "lastSavedAt"
    `;
    
    values.push(workId, vendor.vendorId);
    
    const result = await this.databaseService.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }

    const work = result.rows[0];
    
    // Parse JSON fields
    work.technologies = JSON.parse(work.technologies || '[]');
    work.evidenceFiles = JSON.parse(work.evidenceFiles || '[]');
    work.questionnaireAnswers = JSON.parse(work.questionnaireAnswers || '[]');
    
    return work;
  }

  /**
   * Get all works for a vendor
   */
  async getVendorWorks(vendorId: string): Promise<VendorWork[]> {
    const vendor = await this.getVendorById(vendorId);
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    const query = `
      SELECT 
        id,
        vendor_id as "vendorId",
        project_name as "projectName",
        description,
        status,
        start_date as "startDate",
        end_date as "endDate",
        client_name as "clientName",
        technologies,
        category,
        share_to_trust_portal as "shareToTrustPortal",
        evidence_files as "evidenceFiles",
        questionnaire_answers as "questionnaireAnswers",
        is_draft as "isDraft",
        created_at as "createdAt",
        updated_at as "updatedAt",
        last_saved_at as "lastSavedAt"
      FROM vendor_works 
      WHERE vendor_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await this.databaseService.query(query, [vendor.vendorId]);
    
    return result.rows.map(work => ({
      ...work,
      technologies: JSON.parse(work.technologies || '[]'),
      evidenceFiles: JSON.parse(work.evidenceFiles || '[]'),
      questionnaireAnswers: JSON.parse(work.questionnaireAnswers || '[]')
    }));
  }

  /**
   * Get a specific work by ID for a vendor
   */
  async getVendorWorkById(vendorId: string, workId: string): Promise<VendorWork | null> {
    const vendor = await this.getVendorById(vendorId);
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    const query = `
      SELECT 
        id,
        vendor_id as "vendorId",
        project_name as "projectName",
        description,
        status,
        start_date as "startDate",
        end_date as "endDate",
        client_name as "clientName",
        technologies,
        category,
        share_to_trust_portal as "shareToTrustPortal",
        evidence_files as "evidenceFiles",
        questionnaire_answers as "questionnaireAnswers",
        is_draft as "isDraft",
        created_at as "createdAt",
        updated_at as "updatedAt",
        last_saved_at as "lastSavedAt"
      FROM vendor_works 
      WHERE id = $1 AND vendor_id = $2
    `;
    
    const result = await this.databaseService.query(query, [workId, vendor.vendorId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const work = result.rows[0];
    
    // Parse JSON fields
    work.technologies = JSON.parse(work.technologies || '[]');
    work.evidenceFiles = JSON.parse(work.evidenceFiles || '[]');
    work.questionnaireAnswers = JSON.parse(work.questionnaireAnswers || '[]');
    
    return work;
  }

  /**
   * Delete vendor work submission
   */
  async deleteVendorWork(vendorId: string, workId: string): Promise<boolean> {
    const vendor = await this.getVendorById(vendorId);
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    const query = `DELETE FROM vendor_works WHERE id = $1 AND vendor_id = $2`;
    const result = await this.databaseService.query(query, [workId, vendor.vendorId]);
    
    return result.rowCount > 0;
  }

  /**
   * Get or create vendor record for authenticated user
   */
  async getOrCreateVendorForUser(userId: string, userEmail: string, userFullName: string): Promise<Vendor> {
    // First try to find existing vendor by user_id if the column exists
    // If not, we'll create a new vendor record
    
    let vendor: Vendor | null = null;
    
    // Try to find vendor by user_id (if the relationship exists)
    try {
      const userQuery = `
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
        WHERE contact_email = $1 OR uuid = $2
      `;
      
      const result = await this.databaseService.query(userQuery, [userEmail, userId]);
      if (result.rows.length > 0) {
        vendor = result.rows[0];
      }
    } catch (error) {
      console.log('No existing vendor found for user, will create new one');
    }
    
    // If no vendor found, create a new one
    if (!vendor) {
      const createQuery = `
        INSERT INTO vendors (
          uuid, company_name, contact_name, contact_email, status, 
          risk_score, risk_level, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
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
      
      const values = [
        userId, // Use user ID as vendor UUID for linking
        userFullName || 'My Company', // Default company name
        userFullName,
        userEmail,
        'Questionnaire Pending',
        0,
        'Low'
      ];
      
      const createResult = await this.databaseService.query(createQuery, values);
      vendor = createResult.rows[0];
      
      console.log(`Created new vendor record for user ${userId}:`, vendor);
    }
    
    return {
      ...vendor,
      // Legacy compatibility
      id: vendor.vendorId.toString(),
      name: vendor.companyName
    };
  }

  /**
   * Get trust portal data for a vendor (public view) - Updated to handle user IDs
   */
  async getTrustPortalData(vendorId: string, userEmail?: string, userFullName?: string): Promise<any> {
    let vendor: Vendor | null = null;
    
    // First try to get vendor by ID
    vendor = await this.getVendorById(vendorId);
    
    // If no vendor found and we have user info, try to get/create vendor for user
    if (!vendor && userEmail) {
      vendor = await this.getOrCreateVendorForUser(vendorId, userEmail, userFullName);
    }
    
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    // Get shared works
    const worksQuery = `
      SELECT 
        id,
        project_name as "projectName",
        description,
        status,
        start_date as "startDate",
        end_date as "endDate",
        client_name as "clientName",
        technologies,
        category,
        created_at as "createdAt"
      FROM vendor_works 
      WHERE vendor_id = $1 AND share_to_trust_portal = true AND is_draft = false
      ORDER BY created_at DESC
    `;
    
    const worksResult = await this.databaseService.query(worksQuery, [vendor.vendorId]);
    const works = worksResult.rows.map(work => ({
      ...work,
      technologies: JSON.parse(work.technologies || '[]')
    }));

    // Get shared questionnaire answers
    const answersQuery = `
      SELECT 
        id,
        question_id as "questionId",
        question,
        answer,
        created_at as "createdAt"
      FROM vendor_questionnaire_answers 
      WHERE vendor_id = $1 AND share_to_trust_portal = true
      ORDER BY created_at DESC
    `;
    
    const answersResult = await this.databaseService.query(answersQuery, [vendor.vendorId]);
    const questionnaireAnswers = answersResult.rows;

    // Get shared evidence files (this would need to be implemented in evidence service)
    // For now, return empty array
    const evidenceFiles = [];

    return {
      vendor: {
        companyName: vendor.companyName,
        region: vendor.region,
        industry: vendor.industry,
        description: vendor.description,
        website: vendor.website
      },
      works,
      questionnaireAnswers,
      evidenceFiles
    };
  }

  /**
   * Generate invite link for trust portal - Updated to handle user IDs
   */
  async generateTrustPortalInviteLink(vendorId: string, userEmail?: string, userFullName?: string): Promise<{ inviteLink: string; inviteToken: string }> {
    let vendor: Vendor | null = null;
    
    // First try to get vendor by ID
    vendor = await this.getVendorById(vendorId);
    
    // If no vendor found and we have user info, try to get/create vendor for user
    if (!vendor && userEmail) {
      vendor = await this.getOrCreateVendorForUser(vendorId, userEmail, userFullName);
    }
    
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    const inviteToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    // Store invite token in database
    const query = `
      INSERT INTO vendor_invite_tokens (
        token, vendor_id, expires_at, created_at
      ) VALUES ($1, $2, $3, NOW())
      ON CONFLICT (vendor_id) 
      DO UPDATE SET token = $1, expires_at = $3, created_at = NOW()
    `;
    
    await this.databaseService.query(query, [inviteToken, vendor.vendorId, expiresAt]);

    const inviteLink = `${process.env.FRONTEND_URL || 'https://garnetai.net'}/trust-portal?token=${inviteToken}`;
    
    return { inviteLink, inviteToken };
  }

  /**
   * Get vendor by invite token
   */
  async getVendorByInviteToken(token: string): Promise<Vendor | null> {
    const query = `
      SELECT 
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
        v.updated_at as "updatedAt"
      FROM vendors v
      JOIN vendor_invite_tokens vit ON v.vendor_id = vit.vendor_id
      WHERE vit.token = $1 AND vit.expires_at > NOW()
    `;
    
    const result = await this.databaseService.query(query, [token]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const vendor = result.rows[0];
    
    return {
      ...vendor,
      // Legacy compatibility
      id: vendor.vendorId.toString(),
      name: vendor.companyName
    };
  }

  /**
   * Update share to trust portal status for questionnaire answer
   */
  async updateQuestionnaireAnswerShareStatus(vendorId: string, answerId: string, shareToTrustPortal: boolean): Promise<boolean> {
    const vendor = await this.getVendorById(vendorId);
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    const query = `
      UPDATE vendor_questionnaire_answers 
      SET share_to_trust_portal = $1, updated_at = NOW()
      WHERE id = $2 AND vendor_id = $3
    `;
    
    const result = await this.databaseService.query(query, [shareToTrustPortal, answerId, vendor.vendorId]);
    
    return result.rowCount > 0;
  }

  /**
   * Update questionnaire answer completion status
   */
  async updateQuestionnaireAnswerStatus(vendorId: string, answerId: string, status: string, shareToTrustPortal?: boolean): Promise<boolean> {
    const vendor = await this.getVendorById(vendorId);
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    let query = `
      UPDATE vendor_questionnaire_answers 
      SET status = $1, updated_at = NOW()
    `;
    const params: any[] = [status];
    let paramIndex = 2;

    // If shareToTrustPortal is provided, update it as well
    if (shareToTrustPortal !== undefined) {
      query += `, share_to_trust_portal = $${paramIndex}`;
      params.push(shareToTrustPortal);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} AND vendor_id = $${paramIndex + 1}`;
    params.push(answerId, vendor.vendorId);
    
    const result = await this.databaseService.query(query, params);
    
    return result.rowCount > 0;
  }
} 