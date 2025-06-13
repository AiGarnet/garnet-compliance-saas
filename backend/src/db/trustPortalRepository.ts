import pool from '../config/database';
import { TrustPortalItem } from '../types/trustPortal';

export class TrustPortalRepository {
  /**
   * Get all trust portal items for a specific vendor
   */
  async getVendorTrustPortalItems(vendorId: number): Promise<TrustPortalItem[]> {
    const query = `
      SELECT * FROM trust_portal_items
      WHERE vendor_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [vendorId]);
    return result.rows;
  }

  /**
   * Add a new item to the trust portal
   */
  async addTrustPortalItem(item: Omit<TrustPortalItem, 'id' | 'created_at' | 'updated_at'>): Promise<TrustPortalItem> {
    const query = `
      INSERT INTO trust_portal_items (
        vendor_id, title, description, category, file_url, 
        file_type, file_size, content, is_questionnaire_answer, questionnaire_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      item.vendorId,
      item.title,
      item.description,
      item.category,
      item.fileUrl,
      item.fileType,
      item.fileSize,
      item.content,
      item.isQuestionnaireAnswer,
      item.questionnaireId
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get all vendors that have trust portal items
   */
  async getVendorsWithTrustPortalItems(): Promise<{ vendorId: number; companyName: string }[]> {
    const query = `
      SELECT DISTINCT v.vendor_id, v.company_name
      FROM vendors v
      INNER JOIN trust_portal_items t ON v.vendor_id = t.vendor_id
      ORDER BY v.company_name ASC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }
} 