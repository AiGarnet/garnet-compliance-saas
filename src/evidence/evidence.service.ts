import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvidenceFile } from './entities/evidence.entity';
import { CreateEvidenceFileDto, UpdateEvidenceFileDto } from './dto/evidence.dto';
import { DigitalOceanSpacesService } from '../common/services/digitalocean-spaces.service';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class EvidenceService {
  private readonly logger = new Logger(EvidenceService.name);

  constructor(
    @InjectRepository(EvidenceFile)
    private evidenceRepository: Repository<EvidenceFile>,
    private spacesService: DigitalOceanSpacesService,
    private databaseService: DatabaseService,
  ) {}

  /**
   * Upload and create an evidence file
   */
  async uploadEvidenceFile(
    file: Express.Multer.File,
    vendorId: string,
    description?: string,
    category?: string,
    userId?: string
  ): Promise<EvidenceFile> {
    try {
      this.logger.log(`Uploading evidence file for vendor ${vendorId}: ${file.originalname}`);

      // Extract text content from file for AI enhancement
      const fileContent = await this.extractTextFromFile(file);

      // Upload to DigitalOcean Spaces
      const uploadResult = await this.spacesService.uploadEvidenceFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        vendorId,
        description
      );

      // Create evidence file record
      const evidenceFile = this.evidenceRepository.create({
        vendorId,
        filename: uploadResult.key.split('/').pop() || file.originalname,
        originalFilename: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        fileContent,
        spacesKey: uploadResult.key,
        spacesUrl: uploadResult.url,
        description,
        category,
        uploadedBy: userId,
      });

      const savedFile = await this.evidenceRepository.save(evidenceFile);
      this.logger.log(`Evidence file saved successfully: ${savedFile.id}`);

      return savedFile;
    } catch (error) {
      this.logger.error(`Failed to upload evidence file: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to upload evidence file: ${error.message}`);
    }
  }

  /**
   * Get all evidence files for a vendor
   */
  async getVendorEvidenceFiles(vendorId: string): Promise<EvidenceFile[]> {
    try {
      const files = await this.evidenceRepository.find({
        where: { vendorId },
        order: { createdAt: 'DESC' }
      });

      this.logger.log(`Found ${files.length} evidence files for vendor ${vendorId}`);
      return files;
    } catch (error) {
      this.logger.error(`Failed to get evidence files: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve evidence files');
    }
  }

  /**
   * Get evidence file by ID
   */
  async getEvidenceFileById(id: string, vendorId: string): Promise<EvidenceFile> {
    try {
      const file = await this.evidenceRepository.findOne({
        where: { id, vendorId }
      });

      if (!file) {
        throw new NotFoundException(`Evidence file with ID ${id} not found`);
      }

      return file;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get evidence file: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve evidence file');
    }
  }

  /**
   * Update evidence file metadata
   */
  async updateEvidenceFile(
    id: string,
    vendorId: string,
    updateDto: UpdateEvidenceFileDto
  ): Promise<EvidenceFile> {
    try {
      const file = await this.getEvidenceFileById(id, vendorId);
      
      Object.assign(file, updateDto);
      const updatedFile = await this.evidenceRepository.save(file);
      
      this.logger.log(`Evidence file updated successfully: ${id}`);
      return updatedFile;
    } catch (error) {
      this.logger.error(`Failed to update evidence file: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update evidence file');
    }
  }

  /**
   * Delete evidence file
   */
  async deleteEvidenceFile(id: string, vendorId: string): Promise<boolean> {
    try {
      const file = await this.getEvidenceFileById(id, vendorId);

      // Delete from DigitalOcean Spaces
      if (file.spacesKey) {
        await this.spacesService.deleteFile(file.spacesKey);
      }

      // Delete from database
      await this.evidenceRepository.remove(file);
      
      this.logger.log(`Evidence file deleted successfully: ${id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete evidence file: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to delete evidence file');
    }
  }

  /**
   * Get evidence files content for AI enhancement
   */
  async getVendorEvidenceContent(vendorId: string): Promise<string[]> {
    try {
      const files = await this.evidenceRepository.find({
        where: { vendorId },
        select: ['fileContent']
      });

      return files
        .filter(file => file.fileContent && file.fileContent.trim().length > 0)
        .map(file => file.fileContent);
    } catch (error) {
      this.logger.error(`Failed to get evidence content: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Generate signed URL for evidence file download
   */
  async generateDownloadUrl(id: string, vendorId: string, expiresIn: number = 3600): Promise<string> {
    try {
      const file = await this.getEvidenceFileById(id, vendorId);
      
      if (!file.spacesKey) {
        throw new BadRequestException('File not available for download');
      }

      return await this.spacesService.generateSignedUrl(file.spacesKey, expiresIn);
    } catch (error) {
      this.logger.error(`Failed to generate download URL: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to generate download URL');
    }
  }

  /**
   * Get evidence file content directly from DigitalOcean Spaces
   */
  async getEvidenceFileContent(id: string, vendorId: string): Promise<any> {
    try {
      const file = await this.getEvidenceFileById(id, vendorId);
      
      if (!file.spacesKey) {
        throw new BadRequestException('File not available');
      }

      // Get the file content from DigitalOcean Spaces
      const fileBuffer = await this.spacesService.getFileContent(file.spacesKey);
      
      // For text files, return as plain text
      if (file.fileType === 'text/plain' || file.originalFilename.toLowerCase().endsWith('.txt')) {
        return {
          content: fileBuffer.toString('utf-8'),
          contentType: 'text/plain',
          filename: file.originalFilename
        };
      }
      
      // For other files, return as base64
      return {
        content: fileBuffer.toString('base64'),
        contentType: file.fileType,
        filename: file.originalFilename
      };
    } catch (error) {
      this.logger.error(`Failed to get evidence file content: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve evidence file content');
    }
  }

  /**
   * Extract text content from uploaded file
   */
  private async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    try {
      // For now, return basic metadata. In the future, implement text extraction for PDFs, docs, etc.
      const metadata = `File: ${file.originalname}\nType: ${file.mimetype}\nSize: ${file.size} bytes\n`;
      
      // TODO: Implement actual text extraction based on file type
      // - PDF: use pdf-parse or similar
      // - DOC/DOCX: use mammoth or similar
      // - TXT: direct text extraction
      
      return metadata;
    } catch (error) {
      this.logger.warn(`Failed to extract text from file: ${error.message}`);
      return `File: ${file.originalname}\nType: ${file.mimetype}`;
    }
  }
} 