import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { 
  TrustPortalItem, 
  VendorWithTrustPortal, 
  TrustPortalFeedback, 
  TrustPortalFeedbackResponse, 
  TrustPortalSharedDocument,
  VendorTrustPortalData 
} from './entities/trust-portal.entity';
import { 
  CreateTrustPortalItemDto, 
  UpdateTrustPortalItemDto, 
  CreateTrustPortalFeedbackDto,
  CreateFeedbackResponseDto,
  UpdateFeedbackStatusDto,
  CreateSharedDocumentDto
} from './dto/trust-portal.dto';

@Injectable()
export class TrustPortalService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get all trust portal items for a specific vendor
   */
  async getVendorTrustPortalItems(vendorId: number): Promise<TrustPortalItem[]> {
    const query = `
      SELECT 
        id,
        vendor_id as "vendorId",
        title,
        description,
        category,
        file_url as "fileUrl",
        file_type as "fileType",
        file_size as "fileSize",
        content,
        is_questionnaire_answer as "isQuestionnaireAnswer",
        questionnaire_id as "questionnaireId",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM trust_portal_items
      WHERE vendor_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await this.databaseService.query(query, [vendorId]);
    return result.rows;
  }

  /**
   * Add a new item to the trust portal
   */
  async addTrustPortalItem(createDto: CreateTrustPortalItemDto): Promise<TrustPortalItem> {
    const query = `
      INSERT INTO trust_portal_items (
        vendor_id, title, description, category, file_url, 
        file_type, file_size, content, is_questionnaire_answer, questionnaire_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING 
        id,
        vendor_id as "vendorId",
        title,
        description,
        category,
        file_url as "fileUrl",
        file_type as "fileType",
        file_size as "fileSize",
        content,
        is_questionnaire_answer as "isQuestionnaireAnswer",
        questionnaire_id as "questionnaireId",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;
    
    const values = [
      createDto.vendorId,
      createDto.title,
      createDto.description || null,
      createDto.category,
      createDto.fileUrl || null,
      createDto.fileType || null,
      createDto.fileSize || null,
      createDto.content || null,
      createDto.isQuestionnaireAnswer,
      createDto.questionnaireId || null
    ];
    
    const result = await this.databaseService.query(query, values);
    return result.rows[0];
  }

  /**
   * Update a trust portal item
   */
  async updateTrustPortalItem(id: number, updateDto: UpdateTrustPortalItemDto): Promise<TrustPortalItem> {
    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateDto.title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      values.push(updateDto.title);
    }
    if (updateDto.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(updateDto.description);
    }
    if (updateDto.category !== undefined) {
      updateFields.push(`category = $${paramIndex++}`);
      values.push(updateDto.category);
    }
    if (updateDto.fileUrl !== undefined) {
      updateFields.push(`file_url = $${paramIndex++}`);
      values.push(updateDto.fileUrl);
    }
    if (updateDto.fileType !== undefined) {
      updateFields.push(`file_type = $${paramIndex++}`);
      values.push(updateDto.fileType);
    }
    if (updateDto.fileSize !== undefined) {
      updateFields.push(`file_size = $${paramIndex++}`);
      values.push(updateDto.fileSize);
    }
    if (updateDto.content !== undefined) {
      updateFields.push(`content = $${paramIndex++}`);
      values.push(updateDto.content);
    }
    if (updateDto.isQuestionnaireAnswer !== undefined) {
      updateFields.push(`is_questionnaire_answer = $${paramIndex++}`);
      values.push(updateDto.isQuestionnaireAnswer);
    }
    if (updateDto.questionnaireId !== undefined) {
      updateFields.push(`questionnaire_id = $${paramIndex++}`);
      values.push(updateDto.questionnaireId);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE trust_portal_items 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        vendor_id as "vendorId",
        title,
        description,
        category,
        file_url as "fileUrl",
        file_type as "fileType",
        file_size as "fileSize",
        content,
        is_questionnaire_answer as "isQuestionnaireAnswer",
        questionnaire_id as "questionnaireId",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await this.databaseService.query(query, values);
    
    if (result.rows.length === 0) {
      throw new NotFoundException('Trust portal item not found');
    }
    
    return result.rows[0];
  }

  /**
   * Delete a trust portal item
   */
  async deleteTrustPortalItem(id: number): Promise<boolean> {
    const query = `DELETE FROM trust_portal_items WHERE id = $1`;
    const result = await this.databaseService.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Get a specific trust portal item by ID
   */
  async getTrustPortalItemById(id: number): Promise<TrustPortalItem> {
    const query = `
      SELECT 
        id,
        vendor_id as "vendorId",
        title,
        description,
        category,
        file_url as "fileUrl",
        file_type as "fileType",
        file_size as "fileSize",
        content,
        is_questionnaire_answer as "isQuestionnaireAnswer",
        questionnaire_id as "questionnaireId",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM trust_portal_items
      WHERE id = $1
    `;
    
    const result = await this.databaseService.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new NotFoundException('Trust portal item not found');
    }
    
    return result.rows[0];
  }

  /**
   * Get all vendors that have trust portal items
   */
  async getVendorsWithTrustPortalItems(): Promise<VendorWithTrustPortal[]> {
    const query = `
      SELECT DISTINCT v.vendor_id as "vendorId", v.company_name as "companyName"
      FROM vendors v
      INNER JOIN trust_portal_items t ON v.vendor_id = t.vendor_id
      ORDER BY v.company_name ASC
    `;
    
    const result = await this.databaseService.query(query);
    return result.rows;
  }

  /**
   * Get trust portal items by category
   */
  async getTrustPortalItemsByCategory(category: string): Promise<TrustPortalItem[]> {
    const query = `
      SELECT 
        id,
        vendor_id as "vendorId",
        title,
        description,
        category,
        file_url as "fileUrl",
        file_type as "fileType",
        file_size as "fileSize",
        content,
        is_questionnaire_answer as "isQuestionnaireAnswer",
        questionnaire_id as "questionnaireId",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM trust_portal_items
      WHERE category = $1
      ORDER BY created_at DESC
    `;
    
    const result = await this.databaseService.query(query, [category]);
    return result.rows;
  }

  /**
   * Get complete trust portal data for a vendor (used for public view)
   */
  async getVendorTrustPortalData(vendorId: number, includePrivate: boolean = false): Promise<VendorTrustPortalData> {
    // Get vendor basic info
    const vendorQuery = `
      SELECT 
        vendor_id as "vendorId",
        company_name as "companyName",
        region,
        industry,
        description,
        website,
        contact_email as "contactEmail",
        contact_name as "contactName",
        status
      FROM vendors 
      WHERE vendor_id = $1
    `;
    const vendorResult = await this.databaseService.query(vendorQuery, [vendorId]);
    
    if (vendorResult.rows.length === 0) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    // Get shared documents
    const documentsQuery = `
      SELECT 
        id,
        vendor_id as "vendorId",
        document_title as "documentTitle",
        document_description as "documentDescription",
        document_category as "documentCategory",
        file_url as "fileUrl",
        file_name as "fileName",
        file_type as "fileType",
        file_size as "fileSize",
        is_evidence_file as "isEvidenceFile",
        is_questionnaire_answer as "isQuestionnaireAnswer",
        questionnaire_id as "questionnaireId",
        work_id as "workId",
        share_to_trust_portal as "shareToTrustPortal",
        display_order as "displayOrder",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM trust_portal_shared_documents
      WHERE vendor_id = $1 AND is_active = true AND share_to_trust_portal = true
      ORDER BY display_order ASC, created_at DESC
    `;
    const documentsResult = await this.databaseService.query(documentsQuery, [vendorId]);

    // Get vendor works that are shared to trust portal
    const worksQuery = `
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
        evidence_files as "evidenceFiles",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM vendor_works
      WHERE vendor_id = $1 AND share_to_trust_portal = true AND is_draft = false
      ORDER BY created_at DESC
    `;
    const worksResult = await this.databaseService.query(worksQuery, [vendorId]);

    // Get feedback (only if accessing as vendor or admin)
    let feedbackResult = { rows: [] };
    if (includePrivate) {
      const feedbackQuery = `
        SELECT 
          f.id,
          f.vendor_id as "vendorId",
          f.enterprise_contact_name as "enterpriseContactName",
          f.enterprise_contact_email as "enterpriseContactEmail",
          f.enterprise_company_name as "enterpriseCompanyName",
          f.feedback_type as "feedbackType",
          f.subject,
          f.message,
          f.status,
          f.priority,
          f.invite_token as "inviteToken",
          f.created_at as "createdAt",
          f.updated_at as "updatedAt"
        FROM trust_portal_feedback f
        WHERE f.vendor_id = $1
        ORDER BY f.created_at DESC
      `;
      feedbackResult = await this.databaseService.query(feedbackQuery, [vendorId]);
    }

    return {
      vendor: vendorResult.rows[0],
      sharedDocuments: documentsResult.rows,
      vendorWorks: worksResult.rows,
      questionnaireAnswers: [], // TODO: Implement questionnaire answers
      evidenceFiles: [], // TODO: Implement evidence files
      feedback: feedbackResult.rows
    };
  }

  /**
   * Create feedback from enterprise
   */
  async createFeedback(createDto: CreateTrustPortalFeedbackDto): Promise<TrustPortalFeedback> {
    const query = `
      INSERT INTO trust_portal_feedback (
        vendor_id, enterprise_contact_name, enterprise_contact_email,
        enterprise_company_name, feedback_type, subject, message, priority, invite_token
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING 
        id,
        vendor_id as "vendorId",
        enterprise_contact_name as "enterpriseContactName",
        enterprise_contact_email as "enterpriseContactEmail",
        enterprise_company_name as "enterpriseCompanyName",
        feedback_type as "feedbackType",
        subject,
        message,
        status,
        priority,
        invite_token as "inviteToken",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;
    
    const values = [
      createDto.vendorId,
      createDto.enterpriseContactName || null,
      createDto.enterpriseContactEmail,
      createDto.enterpriseCompanyName || null,
      createDto.feedbackType,
      createDto.subject,
      createDto.message,
      createDto.priority || 'medium',
      createDto.inviteToken || null
    ];
    
    const result = await this.databaseService.query(query, values);
    return result.rows[0];
  }

  /**
   * Get feedback for a vendor
   */
  async getVendorFeedback(vendorId: number): Promise<TrustPortalFeedback[]> {
    const query = `
      SELECT 
        f.id,
        f.vendor_id as "vendorId",
        f.enterprise_contact_name as "enterpriseContactName",
        f.enterprise_contact_email as "enterpriseContactEmail",
        f.enterprise_company_name as "enterpriseCompanyName",
        f.feedback_type as "feedbackType",
        f.subject,
        f.message,
        f.status,
        f.priority,
        f.invite_token as "inviteToken",
        f.created_at as "createdAt",
        f.updated_at as "updatedAt",
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', r.id,
              'feedbackId', r.feedback_id,
              'responderType', r.responder_type,
              'responderName', r.responder_name,
              'responderEmail', r.responder_email,
              'message', r.message,
              'attachments', r.attachments,
              'isInternalNote', r.is_internal_note,
              'createdAt', r.created_at
            ) ORDER BY r.created_at ASC
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) as responses
      FROM trust_portal_feedback f
      LEFT JOIN trust_portal_feedback_responses r ON f.id = r.feedback_id
      WHERE f.vendor_id = $1
      GROUP BY f.id, f.vendor_id, f.enterprise_contact_name, f.enterprise_contact_email,
               f.enterprise_company_name, f.feedback_type, f.subject, f.message,
               f.status, f.priority, f.invite_token, f.created_at, f.updated_at
      ORDER BY f.created_at DESC
    `;
    
    const result = await this.databaseService.query(query, [vendorId]);
    return result.rows;
  }

  /**
   * Add response to feedback
   */
  async addFeedbackResponse(createDto: CreateFeedbackResponseDto): Promise<TrustPortalFeedbackResponse> {
    const query = `
      INSERT INTO trust_portal_feedback_responses (
        feedback_id, responder_type, responder_name, responder_email,
        message, attachments, is_internal_note
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id,
        feedback_id as "feedbackId",
        responder_type as "responderType",
        responder_name as "responderName",
        responder_email as "responderEmail",
        message,
        attachments,
        is_internal_note as "isInternalNote",
        created_at as "createdAt"
    `;
    
    const values = [
      createDto.feedbackId,
      createDto.responderType,
      createDto.responderName || null,
      createDto.responderEmail || null,
      createDto.message,
      JSON.stringify(createDto.attachments || []),
      createDto.isInternalNote || false
    ];
    
    const result = await this.databaseService.query(query, values);
    return result.rows[0];
  }

  /**
   * Update feedback status
   */
  async updateFeedbackStatus(feedbackId: number, updateDto: UpdateFeedbackStatusDto): Promise<TrustPortalFeedback> {
    const query = `
      UPDATE trust_portal_feedback 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING 
        id,
        vendor_id as "vendorId",
        enterprise_contact_name as "enterpriseContactName",
        enterprise_contact_email as "enterpriseContactEmail",
        enterprise_company_name as "enterpriseCompanyName",
        feedback_type as "feedbackType",
        subject,
        message,
        status,
        priority,
        invite_token as "inviteToken",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;
    
    const result = await this.databaseService.query(query, [updateDto.status, feedbackId]);
    
    if (result.rows.length === 0) {
      throw new NotFoundException('Feedback not found');
    }
    
    return result.rows[0];
  }

  /**
   * Create shared document
   */
  async createSharedDocument(createDto: CreateSharedDocumentDto): Promise<TrustPortalSharedDocument> {
    const query = `
      INSERT INTO trust_portal_shared_documents (
        vendor_id, document_title, document_description, document_category,
        file_url, file_name, file_type, file_size, is_evidence_file,
        is_questionnaire_answer, questionnaire_id, work_id, display_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING 
        id,
        vendor_id as "vendorId",
        document_title as "documentTitle",
        document_description as "documentDescription",
        document_category as "documentCategory",
        file_url as "fileUrl",
        file_name as "fileName",
        file_type as "fileType",
        file_size as "fileSize",
        is_evidence_file as "isEvidenceFile",
        is_questionnaire_answer as "isQuestionnaireAnswer",
        questionnaire_id as "questionnaireId",
        work_id as "workId",
        share_to_trust_portal as "shareToTrustPortal",
        is_active as "isActive",
        display_order as "displayOrder",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;
    
    const values = [
      createDto.vendorId,
      createDto.documentTitle,
      createDto.documentDescription || null,
      createDto.documentCategory,
      createDto.fileUrl || null,
      createDto.fileName || null,
      createDto.fileType || null,
      createDto.fileSize || null,
      createDto.isEvidenceFile || false,
      createDto.isQuestionnaireAnswer || false,
      createDto.questionnaireId || null,
      createDto.workId || null,
      createDto.displayOrder || 0
    ];
    
    const result = await this.databaseService.query(query, values);
    return result.rows[0];
  }
} 