import { IsUUID, IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum ChecklistExtractionStatus {
  PENDING = 'pending',
  EXTRACTING = 'extracting',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export enum QuestionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  NEEDS_SUPPORT = 'needs-support'
}

export class CreateChecklistDto {
  @IsUUID()
  vendorId: string;

  @IsString()
  name: string;

  @IsString()
  fileType: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @IsString()
  originalFilename: string;

  @IsOptional()
  @IsString()
  fileContent?: string;

  @IsOptional()
  @IsEnum(ChecklistExtractionStatus)
  extractionStatus?: ChecklistExtractionStatus;
}

export class CreateQuestionDto {
  @IsString()
  questionText: string;

  @IsNumber()
  questionOrder: number;

  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus;

  @IsOptional()
  @IsString()
  aiAnswer?: string;

  @IsOptional()
  @IsNumber()
  confidenceScore?: number;

  @IsOptional()
  @IsBoolean()
  requiresDocument?: boolean;

  @IsOptional()
  @IsString()
  documentDescription?: string;
}

export class UpdateQuestionDto {
  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus;

  @IsOptional()
  @IsString()
  aiAnswer?: string;

  @IsOptional()
  @IsNumber()
  confidenceScore?: number;
}

export class CreateSupportingDocumentDto {
  @IsUUID()
  questionId: string;

  @IsString()
  filename: string;

  @IsString()
  fileType: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @IsOptional()
  @IsString()
  filePath?: string;
}

export class GenerateAnswersDto {
  @IsArray()
  @IsString({ each: true })
  questions: string[];

  @IsOptional()
  @IsString()
  context?: string;

  @IsUUID()
  vendorId: string;

  @IsOptional()
  @IsUUID()
  checklistId?: string;
}

export class ChecklistResponseDto {
  id: string;
  vendorId: string;
  name: string;
  fileType: string;
  fileSize?: number;
  originalFilename: string;
  extractionStatus: ChecklistExtractionStatus;
  questionCount: number;
  uploadDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class QuestionResponseDto {
  id: string;
  checklistId: string;
  vendorId: string;
  questionText: string;
  questionOrder: number;
  status: QuestionStatus;
  aiAnswer?: string;
  confidenceScore?: number;
  requiresDocument: boolean;
  documentDescription?: string;
  createdAt: Date;
  updatedAt: Date;
  supportingDocuments?: SupportingDocumentResponseDto[];
}

export class SupportingDocumentResponseDto {
  id: string;
  questionId: string;
  vendorId: string;
  filename: string;
  fileType: string;
  fileSize?: number;
  filePath?: string;
  uploadedAt: Date;
} 