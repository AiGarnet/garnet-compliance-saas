import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { TrustPortalItem, VendorWithTrustPortal } from './entities/trust-portal.entity';
import { CreateTrustPortalItemDto, UpdateTrustPortalItemDto } from './dto/trust-portal.dto';

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
} 