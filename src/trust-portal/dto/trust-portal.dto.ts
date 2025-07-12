import { IsString, IsOptional, IsNumber, IsNotEmpty, IsBoolean, IsIn, IsEnum, IsArray, IsEmail, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrustPortalCategory } from '../entities/trust-portal.entity';

export enum FeedbackType {
  GENERAL = 'general',
  DOCUMENT_REQUEST = 'document_request',
  CLARIFICATION = 'clarification',
  COMPLIANCE_ISSUE = 'compliance_issue',
  FOLLOW_UP = 'follow_up'
}

export enum FeedbackStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum FeedbackPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum ResponderType {
  VENDOR = 'vendor',
  ENTERPRISE = 'enterprise',
  ADMIN = 'admin'
}

export class CreateTrustPortalItemDto {
  @ApiProperty({ example: 123 })
  @IsNumber()
  @IsNotEmpty()
  vendorId: number;

  @ApiProperty({ example: 'ISO 27001 Certificate' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Our ISO 27001 certification demonstrates our commitment to information security' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    example: 'Certification',
    enum: ['Certification', 'Statement', 'Policy', 'Evidence', 'Questionnaire']
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['Certification', 'Statement', 'Policy', 'Evidence', 'Questionnaire'])
  category: TrustPortalCategory;

  @ApiPropertyOptional({ example: 'https://example.com/certificate.pdf' })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional({ example: '2.5MB' })
  @IsOptional()
  @IsString()
  fileSize?: string;

  @ApiPropertyOptional({ example: 'Detailed content of the trust portal item' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isQuestionnaireAnswer: boolean;

  @ApiPropertyOptional({ example: 'Q001' })
  @IsOptional()
  @IsString()
  questionnaireId?: string;
}

export class UpdateTrustPortalItemDto {
  @ApiPropertyOptional({ example: 'Updated ISO 27001 Certificate' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    example: 'Policy',
    enum: ['Certification', 'Statement', 'Policy', 'Evidence', 'Questionnaire']
  })
  @IsOptional()
  @IsString()
  @IsIn(['Certification', 'Statement', 'Policy', 'Evidence', 'Questionnaire'])
  category?: TrustPortalCategory;

  @ApiPropertyOptional({ example: 'https://example.com/updated-certificate.pdf' })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional({ example: '3.0MB' })
  @IsOptional()
  @IsString()
  fileSize?: string;

  @ApiPropertyOptional({ example: 'Updated content' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isQuestionnaireAnswer?: boolean;

  @ApiPropertyOptional({ example: 'Q002' })
  @IsOptional()
  @IsString()
  questionnaireId?: string;
}

export class CreateTrustPortalFeedbackDto {
  @ApiProperty()
  @IsNumber()
  vendorId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  enterpriseContactName?: string;

  @ApiProperty()
  @IsEmail()
  enterpriseContactEmail: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  enterpriseCompanyName?: string;

  @ApiProperty({ enum: FeedbackType })
  @IsEnum(FeedbackType)
  feedbackType: FeedbackType;

  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional({ enum: FeedbackPriority })
  @IsOptional()
  @IsEnum(FeedbackPriority)
  priority?: FeedbackPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inviteToken?: string;
}

export class CreateVendorFeedbackDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  vendorId?: number; // Optional since it comes from URL parameter

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  enterpriseContactName?: string;

  @ApiProperty()
  @IsEmail()
  enterpriseContactEmail: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  enterpriseCompanyName?: string;

  @ApiProperty({ enum: FeedbackType })
  @IsEnum(FeedbackType)
  feedbackType: FeedbackType;

  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional({ enum: FeedbackPriority })
  @IsOptional()
  @IsEnum(FeedbackPriority)
  priority?: FeedbackPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inviteToken?: string;
}

export class CreateFeedbackResponseDto {
  @ApiProperty()
  @IsNumber()
  feedbackId: number;

  @ApiProperty({ enum: ResponderType })
  @IsEnum(ResponderType)
  responderType: ResponderType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responderName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  responderEmail?: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  attachments?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isInternalNote?: boolean;
}

export class UpdateFeedbackStatusDto {
  @ApiProperty({ enum: FeedbackStatus })
  @IsEnum(FeedbackStatus)
  status: FeedbackStatus;
}

export class CreateSharedDocumentDto {
  @ApiProperty()
  @IsNumber()
  vendorId: number;

  @ApiProperty()
  @IsString()
  documentTitle: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentDescription?: string;

  @ApiProperty()
  @IsString()
  documentCategory: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  fileUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEvidenceFile?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isQuestionnaireAnswer?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  questionnaireId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
} 