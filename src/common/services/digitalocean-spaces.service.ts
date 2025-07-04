import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  key: string;
  url: string;
  cdnUrl: string;
  size: number;
  contentType: string;
}

@Injectable()
export class DigitalOceanSpacesService {
  private readonly logger = new Logger(DigitalOceanSpacesService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly endpoint: string;
  private readonly cdnEndpoint: string;
  private readonly folders: { checklists: string; supportingDocs: string; evidenceFiles: string };

  constructor(private configService: ConfigService) {
    const spacesConfig = this.configService.get('digitalOceanSpaces');
    
    if (!spacesConfig.accessKeyId || !spacesConfig.secretAccessKey) {
      throw new Error('DigitalOcean Spaces credentials not configured');
    }

    this.s3Client = new S3Client({
      endpoint: spacesConfig.endpoint,
      region: spacesConfig.region,
      credentials: {
        accessKeyId: spacesConfig.accessKeyId,
        secretAccessKey: spacesConfig.secretAccessKey,
      },
      forcePathStyle: false, // DigitalOcean Spaces uses virtual-hosted-style URLs
    });

    this.bucketName = spacesConfig.bucket;
    this.endpoint = spacesConfig.endpoint;
    this.cdnEndpoint = spacesConfig.cdnEndpoint;
    this.folders = spacesConfig.folders;

    this.logger.log(`DigitalOcean Spaces service initialized for bucket: ${this.bucketName}`);
  }

  /**
   * Upload a checklist JSON file to the checklists folder
   */
  async uploadChecklist(
    checklistData: any,
    vendorId: string,
    checklistId: string,
    originalFilename?: string
  ): Promise<UploadResult> {
    const filename = `${vendorId}_${checklistId}_${Date.now()}.json`;
    const key = `${this.folders.checklists}${filename}`;
    
    const jsonContent = JSON.stringify({
      ...checklistData,
      metadata: {
        vendorId,
        checklistId,
        originalFilename,
        uploadedAt: new Date().toISOString(),
        version: '1.0'
      }
    }, null, 2);

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: jsonContent,
        ContentType: 'application/json',
        ACL: 'private', // Keep checklists private
        Metadata: {
          vendorId,
          checklistId,
          originalFilename: originalFilename || 'unknown',
          uploadType: 'checklist'
        }
      });

      await this.s3Client.send(command);

      const result: UploadResult = {
        key,
        url: `https://${this.bucketName}.${this.endpoint.replace('https://', '')}/${key}`,
        cdnUrl: `${this.cdnEndpoint}/${key}`,
        size: Buffer.byteLength(jsonContent, 'utf8'),
        contentType: 'application/json'
      };

      this.logger.log(`Checklist uploaded successfully: ${key}`);
      return result;

    } catch (error) {
      this.logger.error(`Failed to upload checklist: ${error.message}`, error.stack);
      throw new Error(`Failed to upload checklist: ${error.message}`);
    }
  }

  /**
   * Upload a supporting document to the supporting-docs folder
   */
  async uploadSupportingDocument(
    fileBuffer: Buffer,
    filename: string,
    contentType: string,
    vendorId: string,
    questionId?: string
  ): Promise<UploadResult> {
    const fileExtension = filename.split('.').pop() || 'bin';
    const uniqueFilename = `${vendorId}_${questionId || 'general'}_${uuidv4()}.${fileExtension}`;
    const key = `${this.folders.supportingDocs}${uniqueFilename}`;

    try {
      // Log the bucket and key for debugging
      this.logger.log(`Uploading to bucket: ${this.bucketName}, key: ${key}`);
      
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName, // Use the configured bucket name
          Key: key, // Use the full path with folder
          Body: fileBuffer,
          ContentType: contentType,
          ACL: 'public-read', // Make supporting docs publicly readable
          Metadata: {
            vendorId,
            questionId: questionId || 'general',
            originalFilename: filename,
            uploadType: 'supporting-document'
          }
        }
      });

      const uploadResult = await upload.done();

      // Create proper URLs for accessing the file
      const result: UploadResult = {
        key,
        url: `https://${this.bucketName}.${this.endpoint.replace('https://', '')}/${key}`,
        cdnUrl: `${this.cdnEndpoint}/${key}`,
        size: fileBuffer.length,
        contentType
      };

      this.logger.log(`Supporting document uploaded successfully: ${key}`);
      return result;

    } catch (error) {
      this.logger.error(`Failed to upload supporting document: ${error.message}`, error.stack);
      throw new Error(`Failed to upload supporting document: ${error.message}`);
    }
  }

  /**
   * Upload an evidence file to the evidence-files folder
   */
  async uploadEvidenceFile(
    fileBuffer: Buffer,
    filename: string,
    contentType: string,
    vendorId: string,
    description?: string
  ): Promise<UploadResult> {
    const fileExtension = filename.split('.').pop() || 'bin';
    const uniqueFilename = `${vendorId}_evidence_${uuidv4()}.${fileExtension}`;
    
    // Ensure we're using the correct folder path with trailing slash
    const key = `${this.folders.evidenceFiles}${uniqueFilename}`;

    try {
      this.logger.log(`Uploading evidence file to bucket: ${this.bucketName}, key: ${key}`);
      
      // Log the folder configuration for debugging
      this.logger.log(`Evidence files folder configuration: "${this.folders.evidenceFiles}"`);
      
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
          ACL: 'private', // Keep evidence files private (internal only)
          Metadata: {
            vendorId,
            originalFilename: filename,
            uploadType: 'evidence-file',
            description: description || ''
          }
        }
      });

      const uploadResult = await upload.done();

      const result: UploadResult = {
        key,
        url: `https://${this.bucketName}.${this.endpoint.replace('https://', '')}/${key}`,
        cdnUrl: `${this.cdnEndpoint}/${key}`,
        size: fileBuffer.length,
        contentType
      };

      this.logger.log(`Evidence file uploaded successfully: ${key}`);
      return result;

    } catch (error) {
      this.logger.error(`Failed to upload evidence file: ${error.message}`, error.stack);
      throw new Error(`Failed to upload evidence file: ${error.message}`);
    }
  }

  /**
   * Delete a file from DigitalOcean Spaces
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);

    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get a file from DigitalOcean Spaces
   */
  async getFile(key: string): Promise<{ body: any; contentType: string; size: number }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const response = await this.s3Client.send(command);

      return {
        body: response.Body,
        contentType: response.ContentType || 'application/octet-stream',
        size: response.ContentLength || 0
      };

    } catch (error) {
      this.logger.error(`Failed to get file: ${error.message}`, error.stack);
      throw new Error(`Failed to get file: ${error.message}`);
    }
  }

  /**
   * Generate a signed URL for temporary access to a private file
   */
  async generateSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      // Log the bucket and key for debugging
      this.logger.log(`Generating signed URL for bucket: ${this.bucketName}, key: ${key}`);
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn
      });

      return signedUrl;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${error.message}`, error.stack);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * List files in a specific folder
   */
  async listFiles(folder: 'checklists' | 'supportingDocs' | 'evidenceFiles', vendorId?: string): Promise<string[]> {
    try {
      const folderPath = this.folders[folder];
      const prefix = vendorId ? `${folderPath}${vendorId}_` : folderPath;

      // This would require implementing ListObjectsV2Command
      // For now, return empty array as placeholder
      return [];

    } catch (error) {
      this.logger.error(`Failed to list files: ${error.message}`, error.stack);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Check if a file exists in DigitalOcean Spaces (throws if not found)
   */
  async getFileMetadata(key: string): Promise<any> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });
      return await this.s3Client.send(command);
    } catch (error) {
      this.logger.warn(`File not found in Spaces: ${key}`);
      throw error;
    }
  }
} 