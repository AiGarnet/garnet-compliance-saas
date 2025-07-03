import { IsString, IsOptional, IsNumber, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadEvidenceDto {
  @ApiPropertyOptional({ example: 'Q001' })
  @IsOptional()
  @IsString()
  answerId?: string;

  @ApiPropertyOptional({ example: 'user-123' })
  @IsOptional()
  @IsString()
  uploadedBy?: string;

  @ApiPropertyOptional({ 
    example: '{"category": "security", "description": "Security certificate"}',
    description: 'Additional metadata as JSON string'
  })
  @IsOptional()
  @IsString()
  metadata?: string;
}

export class EvidenceFileDto {
  @ApiProperty({ example: 'evidence-123' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'security-certificate.pdf' })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({ example: 1024000 })
  @IsNumber()
  fileSize: number;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({ example: '2023-12-15T10:30:00Z' })
  uploadedAt: Date;

  @ApiPropertyOptional({ example: { category: 'security' } })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: 'Q001' })
  @IsOptional()
  @IsString()
  answerId?: string;
}

export class CreateEvidenceFileDto {
  @ApiProperty({ example: 'f18eec97-86e9-44c4-80b7-c86461f3efbe' })
  @IsUUID()
  @IsNotEmpty()
  vendorId: string;

  @ApiProperty({ example: 'security-policy.pdf' })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({ example: 'Security Policy Document.pdf' })
  @IsString()
  @IsNotEmpty()
  originalFilename: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  fileType: string;

  @ApiPropertyOptional({ example: 1048576 })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional({ example: 'This document contains our security policies and procedures.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Security' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'evidence-files/vendor_evidence_12345.pdf' })
  @IsOptional()
  @IsString()
  spacesKey?: string;

  @ApiPropertyOptional({ example: 'https://vendor-onboarding.ams3.digitaloceanspaces.com/evidence-files/vendor_evidence_12345.pdf' })
  @IsOptional()
  @IsString()
  spacesUrl?: string;

  @ApiPropertyOptional({ example: 'user-uuid-here' })
  @IsOptional()
  @IsUUID()
  uploadedBy?: string;
}

export class UpdateEvidenceFileDto {
  @ApiPropertyOptional({ example: 'Updated description for the evidence file' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Compliance' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class EvidenceFileResponseDto {
  @ApiProperty({ example: 'f18eec97-86e9-44c4-80b7-c86461f3efbe' })
  id: string;

  @ApiProperty({ example: 'f18eec97-86e9-44c4-80b7-c86461f3efbe' })
  vendorId: string;

  @ApiProperty({ example: 'security-policy.pdf' })
  filename: string;

  @ApiProperty({ example: 'Security Policy Document.pdf' })
  originalFilename: string;

  @ApiProperty({ example: 'application/pdf' })
  fileType: string;

  @ApiProperty({ example: 1048576 })
  fileSize: number;

  @ApiPropertyOptional({ example: 'This document contains our security policies and procedures.' })
  description?: string;

  @ApiPropertyOptional({ example: 'Security' })
  category?: string;

  @ApiProperty({ example: '2025-01-01T12:00:00Z' })
  uploadDate: Date;

  @ApiProperty({ example: '2025-01-01T12:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-01T12:00:00Z' })
  updatedAt: Date;
} 