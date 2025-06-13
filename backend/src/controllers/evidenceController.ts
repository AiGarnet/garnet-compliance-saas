import { Request, Response } from 'express';
import { EvidenceService, FileUploadData } from '../services/evidenceService';
import multer from 'multer';
import { VendorRepository } from '../db/vendorRepository';

// Extend Express Request to include file upload
interface MulterRequest extends Request {
  file?: any; // Simplified to avoid Express namespace issues
}

export class EvidenceController {
  private evidenceService: EvidenceService;
  private vendorRepository: VendorRepository;

  constructor() {
    this.evidenceService = new EvidenceService();
    this.vendorRepository = new VendorRepository();
  }

  /**
   * Helper method to resolve vendor ID from UUID or numeric ID
   */
  private async resolveVendorId(vendorIdParam: string): Promise<number> {
    // Check if it's a UUID (contains hyphens and is 36 chars)
    if (vendorIdParam.includes('-') && vendorIdParam.length === 36) {
      const vendor = await this.vendorRepository.getVendorByUuid(vendorIdParam);
      if (!vendor) {
        throw new Error('Vendor not found');
      }
      return vendor.vendorId;
    }
    
    // Try to parse as numeric ID
    const numericId = parseInt(vendorIdParam);
    if (isNaN(numericId)) {
      throw new Error('Invalid vendor ID format');
    }
    
    // Verify vendor exists
    const vendor = await this.vendorRepository.getVendorById(numericId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    
    return numericId;
  }

  /**
   * Upload evidence file for a vendor
   */
  uploadEvidence = async (req: MulterRequest, res: Response) => {
    try {
      const { vendorId: vendorIdParam } = req.params;
      const { answerId, uploadedBy, metadata } = req.body;

      if (!vendorIdParam) {
        return res.status(400).json({ 
          error: 'Vendor ID is required' 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          error: 'No file uploaded' 
        });
      }

      // Resolve vendor ID (UUID to numeric)
      const vendorId = await this.resolveVendorId(vendorIdParam);

      // For now, we'll use a placeholder user ID - in production this would come from auth
      const actualUploadedBy = uploadedBy || 'system-user-id';

      const fileData: FileUploadData = {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer
      };

      const evidenceFile = await this.evidenceService.uploadEvidenceFile({
        vendorId: vendorId,
        answerId: answerId || undefined,
        file: fileData,
        uploadedBy: actualUploadedBy,
        metadata: metadata ? JSON.parse(metadata) : undefined
      });

      res.status(201).json({
        success: true,
        message: 'Evidence file uploaded successfully',
        evidenceFile: {
          id: evidenceFile.id,
          filename: evidenceFile.filename,
          fileSize: evidenceFile.fileSize,
          mimeType: evidenceFile.mimeType,
          uploadedAt: evidenceFile.uploadedAt,
          metadata: evidenceFile.metadata
        }
      });

    } catch (error: any) {
      console.error('Error uploading evidence file:', error);
      
      if (error.message === 'Vendor not found') {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      if (error.message === 'Invalid vendor ID format') {
        return res.status(400).json({ error: 'Invalid vendor ID format' });
      }
      
      res.status(500).json({ 
        error: error.message || 'Failed to upload evidence file' 
      });
    }
  };

  /**
   * Get evidence files for a vendor
   */
  getVendorEvidence = async (req: Request, res: Response) => {
    try {
      const { vendorId: vendorIdParam } = req.params;

      if (!vendorIdParam) {
        return res.status(400).json({ 
          error: 'Vendor ID is required' 
        });
      }

      // Resolve vendor ID (UUID to numeric)
      const vendorId = await this.resolveVendorId(vendorIdParam);

      const evidenceFiles = await this.evidenceService.getVendorEvidenceFiles(vendorId);

      const formattedFiles = evidenceFiles.map(file => ({
        id: file.id,
        filename: file.filename,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        uploadedAt: file.uploadedAt,
        metadata: file.metadata,
        answerId: file.answerId
      }));

      res.json({
        success: true,
        evidenceFiles: formattedFiles,
        count: formattedFiles.length
      });

    } catch (error: any) {
      console.error('Error getting vendor evidence files:', error);
      
      if (error.message === 'Vendor not found') {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      if (error.message === 'Invalid vendor ID format') {
        return res.status(400).json({ error: 'Invalid vendor ID format' });
      }
      
      res.status(500).json({ 
        error: error.message || 'Failed to get evidence files' 
      });
    }
  };

  /**
   * Download evidence file
   */
  downloadEvidence = async (req: Request, res: Response) => {
    try {
      const { vendorId: vendorIdParam, evidenceId } = req.params;

      if (!vendorIdParam || !evidenceId) {
        return res.status(400).json({ 
          error: 'Vendor ID and Evidence ID are required' 
        });
      }

      // Resolve vendor ID (UUID to numeric)
      const vendorId = await this.resolveVendorId(vendorIdParam);

      const { file, content } = await this.evidenceService.getEvidenceFileContent(
        evidenceId, 
        vendorId
      );

      // Set appropriate headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Length', file.fileSize.toString());

      res.send(content);

    } catch (error: any) {
      console.error('Error downloading evidence file:', error);
      
      if (error.message === 'Vendor not found') {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      if (error.message === 'Invalid vendor ID format') {
        return res.status(400).json({ error: 'Invalid vendor ID format' });
      }
      
      if (error.message.includes('not found')) {
        return res.status(404).json({ 
          error: error.message 
        });
      }
      
      if (error.message.includes('Access denied')) {
        return res.status(403).json({ 
          error: error.message 
        });
      }

      res.status(500).json({ 
        error: error.message || 'Failed to download evidence file' 
      });
    }
  };

  /**
   * Delete evidence file
   */
  deleteEvidence = async (req: Request, res: Response) => {
    try {
      const { vendorId: vendorIdParam, evidenceId } = req.params;

      if (!vendorIdParam || !evidenceId) {
        return res.status(400).json({ 
          error: 'Vendor ID and Evidence ID are required' 
        });
      }

      // Resolve vendor ID (UUID to numeric)
      const vendorId = await this.resolveVendorId(vendorIdParam);

      const deleted = await this.evidenceService.deleteEvidenceFile(
        evidenceId, 
        vendorId
      );

      if (deleted) {
        res.json({
          success: true,
          message: 'Evidence file deleted successfully'
        });
      } else {
        res.status(404).json({
          error: 'Evidence file not found'
        });
      }

    } catch (error: any) {
      console.error('Error deleting evidence file:', error);
      
      if (error.message === 'Vendor not found') {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      if (error.message === 'Invalid vendor ID format') {
        return res.status(400).json({ error: 'Invalid vendor ID format' });
      }
      
      if (error.message.includes('not found')) {
        return res.status(404).json({ 
          error: error.message 
        });
      }
      
      if (error.message.includes('Access denied')) {
        return res.status(403).json({ 
          error: error.message 
        });
      }

      res.status(500).json({ 
        error: error.message || 'Failed to delete evidence file' 
      });
    }
  };

  /**
   * Get evidence files by answer ID
   */
  getAnswerEvidence = async (req: Request, res: Response) => {
    try {
      const { answerId } = req.params;

      if (!answerId) {
        return res.status(400).json({ 
          error: 'Answer ID is required' 
        });
      }

      const evidenceFiles = await this.evidenceService.getAnswerEvidenceFiles(answerId);

      const formattedFiles = evidenceFiles.map(file => ({
        id: file.id,
        filename: file.filename,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        uploadedAt: file.uploadedAt,
        metadata: file.metadata,
        vendorId: file.vendorId
      }));

      res.json({
        success: true,
        evidenceFiles: formattedFiles,
        count: formattedFiles.length
      });

    } catch (error: any) {
      console.error('Error getting answer evidence files:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to get evidence files' 
      });
    }
  };

  /**
   * Get evidence count for a vendor
   */
  getVendorEvidenceCount = async (req: Request, res: Response) => {
    try {
      const { vendorId: vendorIdParam } = req.params;

      if (!vendorIdParam) {
        return res.status(400).json({ 
          error: 'Vendor ID is required' 
        });
      }

      // Resolve vendor ID (UUID to numeric)
      const vendorId = await this.resolveVendorId(vendorIdParam);

      const count = await this.evidenceService.getVendorEvidenceCount(vendorId);

      res.json({
        success: true,
        count: count
      });

    } catch (error: any) {
      console.error('Error getting vendor evidence count:', error);
      
      if (error.message === 'Vendor not found') {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      if (error.message === 'Invalid vendor ID format') {
        return res.status(400).json({ error: 'Invalid vendor ID format' });
      }
      
      res.status(500).json({ 
        error: error.message || 'Failed to get evidence count' 
      });
    }
  };
}

// Configure multer for file upload
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Allowed file types
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

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, JPG, JPEG, PNG, GIF, TXT, XLS, XLSX'));
    }
  }
}); 