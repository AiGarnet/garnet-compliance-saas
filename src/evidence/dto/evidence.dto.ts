import { IsString, IsOptional, IsNumber, IsNotEmpty, IsJSON } from 'class-validator';
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