import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export interface EvidenceFile {
  id: string;
  vendorId?: number;
  answerId?: string;
  filename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  metadata?: any;
  uploadedBy: string;
  uploadedAt: Date;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEvidenceFileData {
  vendorId?: number;
  answerId?: string;
  filename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  metadata?: any;
  uploadedBy: string;
  expiryDate?: Date;
}

export class EvidenceRepository {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  /**
   * Create a new evidence file record
   */
  async createEvidenceFile(data: CreateEvidenceFileData): Promise<EvidenceFile> {
    const id = uuidv4();
    const now = new Date();
    
    const query = `
      INSERT INTO evidence_files (
        id, vendor_id, answer_id, filename, file_path, file_size, 
        mime_type, metadata, uploaded_by, uploaded_at, expiry_date,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    const values = [
      id,
      data.vendorId || null,
      data.answerId || null,
      data.filename,
      data.filePath,
      data.fileSize,
      data.mimeType,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.uploadedBy,
      now,
      data.expiryDate || null,
      now,
      now
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToEvidenceFile(result.rows[0]);
  }

  /**
   * Get evidence files by vendor ID
   */
  async getEvidenceFilesByVendorId(vendorId: number): Promise<EvidenceFile[]> {
    const query = `
      SELECT * FROM evidence_files 
      WHERE vendor_id = $1 
      ORDER BY uploaded_at DESC
    `;
    
    const result = await this.pool.query(query, [vendorId]);
    return result.rows.map(row => this.mapRowToEvidenceFile(row));
  }

  /**
   * Get evidence files by answer ID
   */
  async getEvidenceFilesByAnswerId(answerId: string): Promise<EvidenceFile[]> {
    const query = `
      SELECT * FROM evidence_files 
      WHERE answer_id = $1 
      ORDER BY uploaded_at DESC
    `;
    
    const result = await this.pool.query(query, [answerId]);
    return result.rows.map(row => this.mapRowToEvidenceFile(row));
  }

  /**
   * Get evidence file by ID
   */
  async getEvidenceFileById(id: string): Promise<EvidenceFile | null> {
    const query = `SELECT * FROM evidence_files WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToEvidenceFile(result.rows[0]);
  }

  /**
   * Delete evidence file by ID
   */
  async deleteEvidenceFile(id: string): Promise<boolean> {
    const query = `DELETE FROM evidence_files WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Update evidence file metadata
   */
  async updateEvidenceFile(id: string, updates: Partial<CreateEvidenceFileData>): Promise<EvidenceFile | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.filename !== undefined) {
      updateFields.push(`filename = $${paramCount++}`);
      values.push(updates.filename);
    }
    
    if (updates.metadata !== undefined) {
      updateFields.push(`metadata = $${paramCount++}`);
      values.push(updates.metadata ? JSON.stringify(updates.metadata) : null);
    }
    
    if (updates.expiryDate !== undefined) {
      updateFields.push(`expiry_date = $${paramCount++}`);
      values.push(updates.expiryDate);
    }

    if (updateFields.length === 0) {
      return this.getEvidenceFileById(id);
    }

    updateFields.push(`updated_at = $${paramCount++}`);
    values.push(new Date());
    values.push(id);

    const query = `
      UPDATE evidence_files 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToEvidenceFile(result.rows[0]);
  }

  /**
   * Get evidence files count by vendor
   */
  async getEvidenceFileCountByVendor(vendorId: number): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM evidence_files WHERE vendor_id = $1`;
    const result = await this.pool.query(query, [vendorId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Check if vendor has access to evidence file
   */
  async checkVendorAccess(evidenceId: string, vendorId: number): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count 
      FROM evidence_files 
      WHERE id = $1 AND vendor_id = $2
    `;
    const result = await this.pool.query(query, [evidenceId, vendorId]);
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Map database row to EvidenceFile interface
   */
  private mapRowToEvidenceFile(row: any): EvidenceFile {
    return {
      id: row.id,
      vendorId: row.vendor_id,
      answerId: row.answer_id,
      filename: row.filename,
      filePath: row.file_path,
      fileSize: parseInt(row.file_size),
      mimeType: row.mime_type,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      uploadedBy: row.uploaded_by,
      uploadedAt: new Date(row.uploaded_at),
      expiryDate: row.expiry_date ? new Date(row.expiry_date) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
} 