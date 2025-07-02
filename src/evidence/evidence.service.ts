import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { 
  EvidenceFile, 
  FileUploadData, 
  UploadEvidenceRequest, 
  EvidenceFileResponse, 
  EvidenceFileContent 
} from './entities/evidence.entity';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EvidenceService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'evidence');

  constructor(private readonly databaseService: DatabaseService) {
    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  /**
   * Ensure upload directory exists
   */
  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Upload evidence file for a vendor
   */
  async uploadEvidenceFile(request: UploadEvidenceRequest): Promise<EvidenceFile> {
    const { vendorId, answerId, file, uploadedBy, metadata } = request;
    
    // Verify vendor exists
    const vendorQuery = `SELECT vendor_id FROM vendors WHERE vendor_id = $1`;
    const vendorResult = await this.databaseService.query(vendorQuery, [vendorId]);
    
    if (vendorResult.rows.length === 0) {
      throw new NotFoundException('Vendor not found');
    }

    // Generate unique file ID and path
    const fileId = uuidv4();
    const fileExtension = path.extname(file.filename);
    const uniqueFilename = `${fileId}${fileExtension}`;
    const filePath = path.join(this.uploadDir, uniqueFilename);

    try {
      // Save file to disk
      fs.writeFileSync(filePath, file.buffer);

      // Save file metadata to database
      const query = `
        INSERT INTO evidence_files (
          id, vendor_id, answer_id, filename, original_filename, 
          mime_type, file_size, file_path, uploaded_by, uploaded_at,
          metadata, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, NOW(), NOW()
        ) RETURNING 
          id,
          vendor_id as "vendorId",
          answer_id as "answerId",
          filename,
          original_filename as "originalFilename",
          mime_type as "mimeType",
          file_size as "fileSize",
          file_path as "filePath",
          uploaded_by as "uploadedBy",
          uploaded_at as "uploadedAt",
          metadata,
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      const values = [
        fileId,
        vendorId,
        answerId || null,
        uniqueFilename,
        file.filename,
        file.mimetype,
        file.size,
        filePath,
        uploadedBy,
        metadata || null
      ];

      const result = await this.databaseService.query(query, values);
      return result.rows[0];

    } catch (error) {
      // Clean up file if database operation fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  }

  /**
   * Get evidence files for a vendor
   */
  async getVendorEvidenceFiles(vendorId: number): Promise<EvidenceFileResponse[]> {
    const query = `
      SELECT 
        id,
        filename,
        file_size as "fileSize",
        mime_type as "mimeType",
        uploaded_at as "uploadedAt",
        metadata,
        answer_id as "answerId"
      FROM evidence_files 
      WHERE vendor_id = $1
      ORDER BY uploaded_at DESC
    `;

    const result = await this.databaseService.query(query, [vendorId]);
    return result.rows;
  }

  /**
   * Get evidence file content for download
   */
  async getEvidenceFileContent(evidenceId: string, vendorId: number): Promise<EvidenceFileContent> {
    const query = `
      SELECT 
        id,
        vendor_id as "vendorId",
        answer_id as "answerId",
        filename,
        original_filename as "originalFilename",
        mime_type as "mimeType",
        file_size as "fileSize",
        file_path as "filePath",
        uploaded_by as "uploadedBy",
        uploaded_at as "uploadedAt",
        metadata,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM evidence_files 
      WHERE id = $1 AND vendor_id = $2
    `;

    const result = await this.databaseService.query(query, [evidenceId, vendorId]);
    
    if (result.rows.length === 0) {
      throw new NotFoundException('Evidence file not found');
    }

    const file = result.rows[0];

    // Check if file exists on disk
    if (!fs.existsSync(file.filePath)) {
      throw new NotFoundException('Evidence file content not found on disk');
    }

    // Read file content
    const content = fs.readFileSync(file.filePath);

    return { file, content };
  }

  /**
   * Delete evidence file
   */
  async deleteEvidenceFile(evidenceId: string, vendorId: number): Promise<boolean> {
    // First get the file info to delete from disk
    const fileQuery = `
      SELECT file_path as "filePath"
      FROM evidence_files 
      WHERE id = $1 AND vendor_id = $2
    `;

    const fileResult = await this.databaseService.query(fileQuery, [evidenceId, vendorId]);
    
    if (fileResult.rows.length === 0) {
      return false;
    }

    const filePath = fileResult.rows[0].filePath;

    // Delete from database
    const deleteQuery = `DELETE FROM evidence_files WHERE id = $1 AND vendor_id = $2`;
    const deleteResult = await this.databaseService.query(deleteQuery, [evidenceId, vendorId]);

    if (deleteResult.rowCount > 0) {
      // Delete file from disk if database deletion was successful
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.error('Failed to delete file from disk:', error);
          // Don't throw error here as database deletion was successful
        }
      }
      return true;
    }

    return false;
  }

  /**
   * Get evidence files for a specific answer
   */
  async getAnswerEvidenceFiles(answerId: string): Promise<EvidenceFileResponse[]> {
    const query = `
      SELECT 
        id,
        filename,
        file_size as "fileSize",
        mime_type as "mimeType",
        uploaded_at as "uploadedAt",
        metadata,
        answer_id as "answerId"
      FROM evidence_files 
      WHERE answer_id = $1
      ORDER BY uploaded_at DESC
    `;

    const result = await this.databaseService.query(query, [answerId]);
    return result.rows;
  }

  /**
   * Get evidence file count for a vendor
   */
  async getVendorEvidenceCount(vendorId: number): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM evidence_files WHERE vendor_id = $1`;
    const result = await this.databaseService.query(query, [vendorId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get total evidence count for an organization (across all vendors)
   */
  async getOrganizationEvidenceCount(organizationId: string): Promise<number> {
    const query = `
      SELECT COUNT(ef.*) as count 
      FROM evidence_files ef
      INNER JOIN vendors v ON ef.vendor_id = v.vendor_id
      WHERE v.organization_id = $1
    `;
    const result = await this.databaseService.query(query, [organizationId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Resolve vendor ID from UUID or numeric ID
   */
  async resolveVendorId(vendorIdParam: string): Promise<number> {
    // Check if it's a UUID (contains hyphens and is 36 chars)
    if (vendorIdParam.includes('-') && vendorIdParam.length === 36) {
      const query = `SELECT vendor_id as "vendorId" FROM vendors WHERE uuid = $1`;
      const result = await this.databaseService.query(query, [vendorIdParam]);
      
      if (result.rows.length === 0) {
        throw new NotFoundException('Vendor not found');
      }
      
      return result.rows[0].vendorId;
    }
    
    // Try to parse as numeric ID
    const numericId = parseInt(vendorIdParam);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid vendor ID format');
    }
    
    // Verify vendor exists
    const query = `SELECT vendor_id FROM vendors WHERE vendor_id = $1`;
    const result = await this.databaseService.query(query, [numericId]);
    
    if (result.rows.length === 0) {
      throw new NotFoundException('Vendor not found');
    }
    
    return numericId;
  }
} 