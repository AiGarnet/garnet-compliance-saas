import { EvidenceRepository, EvidenceFile, CreateEvidenceFileData } from '../db/evidenceRepository';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export interface FileUploadData {
  filename: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface UploadEvidenceRequest {
  vendorId?: number;
  answerId?: string;
  file: FileUploadData;
  uploadedBy: string;
  metadata?: any;
}

export class EvidenceService {
  private evidenceRepository: EvidenceRepository;
  private uploadDir: string;

  constructor() {
    this.evidenceRepository = new EvidenceRepository();
    
    // Set upload directory - in production this would be cloud storage
    this.uploadDir = process.env.EVIDENCE_UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'evidence');
    
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Upload evidence file for a vendor
   */
  async uploadEvidenceFile(data: UploadEvidenceRequest): Promise<EvidenceFile> {
    // Validate file
    this.validateFile(data.file);

    // Generate unique filename
    const fileExtension = path.extname(data.file.filename);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, uniqueFilename);

    try {
      // Save file to disk
      await fs.promises.writeFile(filePath, data.file.buffer);

      // Create database record
      const evidenceData: CreateEvidenceFileData = {
        vendorId: data.vendorId,
        answerId: data.answerId,
        filename: data.file.filename,
        filePath: filePath,
        fileSize: data.file.size,
        mimeType: data.file.mimetype,
        metadata: data.metadata,
        uploadedBy: data.uploadedBy
      };

      const evidenceFile = await this.evidenceRepository.createEvidenceFile(evidenceData);
      
      console.log(`Evidence file uploaded successfully: ${evidenceFile.id}`);
      return evidenceFile;

    } catch (error) {
      // Clean up file if database operation fails
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      throw error;
    }
  }

  /**
   * Get evidence files for a vendor
   */
  async getVendorEvidenceFiles(vendorId: number): Promise<EvidenceFile[]> {
    return this.evidenceRepository.getEvidenceFilesByVendorId(vendorId);
  }

  /**
   * Get evidence files for a specific answer
   */
  async getAnswerEvidenceFiles(answerId: string): Promise<EvidenceFile[]> {
    return this.evidenceRepository.getEvidenceFilesByAnswerId(answerId);
  }

  /**
   * Delete evidence file
   */
  async deleteEvidenceFile(evidenceId: string, vendorId?: number): Promise<boolean> {
    // Get evidence file info
    const evidenceFile = await this.evidenceRepository.getEvidenceFileById(evidenceId);
    
    if (!evidenceFile) {
      throw new Error('Evidence file not found');
    }

    // Check vendor access if vendorId is provided
    if (vendorId && evidenceFile.vendorId !== vendorId) {
      throw new Error('Access denied: This evidence file does not belong to the specified vendor');
    }

    try {
      // Delete from database
      const deleted = await this.evidenceRepository.deleteEvidenceFile(evidenceId);
      
      if (deleted) {
        // Delete physical file
        if (fs.existsSync(evidenceFile.filePath)) {
          await fs.promises.unlink(evidenceFile.filePath);
        }
        
        console.log(`Evidence file deleted successfully: ${evidenceId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error deleting evidence file ${evidenceId}:`, error);
      throw error;
    }
  }

  /**
   * Get evidence file content for download
   */
  async getEvidenceFileContent(evidenceId: string, vendorId?: number): Promise<{
    file: EvidenceFile;
    content: Buffer;
  }> {
    const evidenceFile = await this.evidenceRepository.getEvidenceFileById(evidenceId);
    
    if (!evidenceFile) {
      throw new Error('Evidence file not found');
    }

    // Check vendor access if vendorId is provided
    if (vendorId && evidenceFile.vendorId !== vendorId) {
      throw new Error('Access denied: This evidence file does not belong to the specified vendor');
    }

    if (!fs.existsSync(evidenceFile.filePath)) {
      throw new Error('Physical file not found on server');
    }

    const content = await fs.promises.readFile(evidenceFile.filePath);
    
    return {
      file: evidenceFile,
      content
    };
  }

  /**
   * Get evidence files count for a vendor
   */
  async getVendorEvidenceCount(vendorId: number): Promise<number> {
    return this.evidenceRepository.getEvidenceFileCountByVendor(vendorId);
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: FileUploadData): void {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds maximum limit of 10MB');
    }

    // Check file type
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(
        'Invalid file type. Allowed types: PDF, DOC, DOCX, JPG, JPEG, PNG, GIF, TXT, XLS, XLSX'
      );
    }

    // Check filename
    if (!file.filename || file.filename.trim() === '') {
      throw new Error('Filename is required');
    }

    // Prevent path traversal attacks
    if (file.filename.includes('..') || file.filename.includes('/') || file.filename.includes('\\')) {
      throw new Error('Invalid filename: path separators not allowed');
    }
  }

  /**
   * Get file extension from mime type
   */
  private getFileExtension(mimetype: string): string {
    const extensions: { [key: string]: string } = {
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'text/plain': '.txt',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
    };

    return extensions[mimetype] || '';
  }
} 