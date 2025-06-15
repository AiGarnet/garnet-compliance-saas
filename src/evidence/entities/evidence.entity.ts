/**
 * Represents an evidence file in the system
 */
export interface EvidenceFile {
  id: string;
  vendorId: number;
  answerId?: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  uploadedBy: string;
  uploadedAt: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for file upload data
 */
export interface FileUploadData {
  filename: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * Interface for uploading evidence
 */
export interface UploadEvidenceRequest {
  vendorId: number;
  answerId?: string;
  file: FileUploadData;
  uploadedBy: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for evidence file response
 */
export interface EvidenceFileResponse {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  metadata?: Record<string, any>;
  answerId?: string;
}

/**
 * Interface for evidence file content
 */
export interface EvidenceFileContent {
  file: EvidenceFile;
  content: Buffer;
} 