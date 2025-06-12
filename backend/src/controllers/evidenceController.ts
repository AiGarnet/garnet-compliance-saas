import { Request, Response } from 'express';
import { EvidenceService, FileUploadData } from '../services/evidenceService';
import multer from 'multer';

// Extend Express Request to include file upload
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export class EvidenceController {
  private evidenceService: EvidenceService;

  constructor() {
    this.evidenceService = new EvidenceService();
  }

  /**
   * Upload evidence file for a vendor
   */
  uploadEvidence = async (req: MulterRequest, res: Response) => {
    try {
      const { vendorId } = req.params;
      const { answerId, metadata, uploadedBy } = req.body;

      if (!vendorId) {
        return res.status(400).json({ 
          error: 'Vendor ID is required' 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          error: 'No file uploaded' 
        });
      }

      // For now, we'll use a placeholder user ID - in production this would come from auth
      const actualUploadedBy = uploadedBy || 'system-user-id';

      const fileData: FileUploadData = {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer
      };

      const evidenceFile = await this.evidenceService.uploadEvidenceFile({
        vendorId: parseInt(vendorId),
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
      const { vendorId } = req.params;

      if (!vendorId) {
        return res.status(400).json({ 
          error: 'Vendor ID is required' 
        });
      }

      const evidenceFiles = await this.evidenceService.getVendorEvidenceFiles(parseInt(vendorId));

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
      const { vendorId, evidenceId } = req.params;

      if (!vendorId || !evidenceId) {
        return res.status(400).json({ 
          error: 'Vendor ID and Evidence ID are required' 
        });
      }

      const { file, content } = await this.evidenceService.getEvidenceFileContent(
        evidenceId, 
        parseInt(vendorId)
      );

      // Set appropriate headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Length', file.fileSize.toString());

      res.send(content);

    } catch (error: any) {
      console.error('Error downloading evidence file:', error);
      
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
      const { vendorId, evidenceId } = req.params;

      if (!vendorId || !evidenceId) {
        return res.status(400).json({ 
          error: 'Vendor ID and Evidence ID are required' 
        });
      }

      const deleted = await this.evidenceService.deleteEvidenceFile(
        evidenceId, 
        parseInt(vendorId)
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
      const { vendorId } = req.params;

      if (!vendorId) {
        return res.status(400).json({ 
          error: 'Vendor ID is required' 
        });
      }

      const count = await this.evidenceService.getVendorEvidenceCount(parseInt(vendorId));

      res.json({
        success: true,
        vendorId: parseInt(vendorId),
        evidenceCount: count
      });

    } catch (error: any) {
      console.error('Error getting vendor evidence count:', error);
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
  fileFilter: (req, file, cb) => {
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