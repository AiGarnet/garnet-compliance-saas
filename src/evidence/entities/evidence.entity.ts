import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Represents an evidence file in the system
 */
@Entity('evidence_files')
export class EvidenceFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId: string;

  @Column({ length: 255 })
  filename: string;

  @Column({ name: 'original_filename', length: 255 })
  originalFilename: string;

  @Column({ name: 'file_type', length: 50 })
  fileType: string;

  @Column({ name: 'file_size', nullable: true })
  fileSize: number;

  @Column({ name: 'file_content', type: 'text', nullable: true })
  fileContent: string;

  @Column({ name: 'spaces_key', nullable: true })
  spacesKey: string;

  @Column({ name: 'spaces_url', nullable: true })
  spacesUrl: string;

  @Column({ nullable: true })
  description: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ name: 'upload_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  uploadDate: Date;

  @Column({ name: 'uploaded_by', type: 'uuid', nullable: true })
  uploadedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
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