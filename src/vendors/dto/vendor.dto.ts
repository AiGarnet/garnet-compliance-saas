import { IsString, IsEmail, IsOptional, IsEnum, IsNumber, IsNotEmpty, Min, Max, IsBoolean, IsArray, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VendorStatus, WorkStatus, AnswerStatus } from '../entities/vendor.entity';

export class CreateVendorDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ example: 'North America' })
  @IsString()
  @IsNotEmpty()
  region: string;

  @ApiProperty({ example: 'contact@acme.com' })
  @IsEmail()
  @IsNotEmpty()
  contactEmail: string;

  @ApiPropertyOptional({ enum: VendorStatus, example: VendorStatus.QUESTIONNAIRE_PENDING })
  @IsOptional()
  @IsEnum(VendorStatus)
  status?: VendorStatus;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({ example: 'https://acme.com' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ example: 'Technology' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ example: 'Leading technology solutions provider' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateVendorDto {
  @ApiPropertyOptional({ example: 'Acme Corporation Updated' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: 'Europe' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: 'newcontact@acme.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ enum: VendorStatus, example: VendorStatus.APPROVED })
  @IsOptional()
  @IsEnum(VendorStatus)
  status?: VendorStatus;

  @ApiPropertyOptional({ example: 'Jane Smith' })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({ example: 'https://newacme.com' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ example: 'Financial Technology' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ example: 'Updated description of services' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class VendorQuestionnaireAnswerDto {
  @ApiProperty({ example: 'Q001' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ example: 'What is your data retention policy?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ example: 'We retain data for 7 years as per regulatory requirements.' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiPropertyOptional({ example: false, description: 'Whether to share this answer on trust portal' })
  @IsOptional()
  @IsBoolean()
  shareToTrustPortal?: boolean;

  @ApiPropertyOptional({ example: 'work-123', description: 'Associated work submission ID' })
  @IsOptional()
  @IsString()
  workId?: string;
}

export class CreateVendorWithAnswersDto extends CreateVendorDto {
  @ApiProperty({ type: [VendorQuestionnaireAnswerDto] })
  answers: VendorQuestionnaireAnswerDto[];
}

export class CreateVendorWorkDto {
  @ApiProperty({ example: 'E-commerce Website Development' })
  @IsString()
  @IsNotEmpty()
  projectName: string;

  @ApiPropertyOptional({ example: 'Complete e-commerce solution with payment integration' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: WorkStatus, example: WorkStatus.COMPLETED })
  @IsEnum(WorkStatus)
  status: WorkStatus;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-03-01' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiPropertyOptional({ example: ['React', 'Node.js', 'MongoDB'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];

  @ApiPropertyOptional({ example: 'Web Development' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: true, description: 'Whether to share this work on trust portal' })
  @IsBoolean()
  shareToTrustPortal: boolean;

  @ApiPropertyOptional({ example: ['evidence-1', 'evidence-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceFiles?: string[];

  @ApiPropertyOptional({ example: ['answer-1', 'answer-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  questionnaireAnswers?: string[];

  @ApiPropertyOptional({ example: false, description: 'Whether this is a draft submission' })
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;
}

export class UpdateVendorWorkDto {
  @ApiPropertyOptional({ example: 'Updated Project Name' })
  @IsOptional()
  @IsString()
  projectName?: string;

  @ApiPropertyOptional({ example: 'Updated project description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: WorkStatus, example: WorkStatus.COMPLETED })
  @IsOptional()
  @IsEnum(WorkStatus)
  status?: WorkStatus;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-03-01' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Updated Client Name' })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiPropertyOptional({ example: ['React', 'Node.js', 'PostgreSQL'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];

  @ApiPropertyOptional({ example: 'Mobile Development' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether to share this work on trust portal' })
  @IsOptional()
  @IsBoolean()
  shareToTrustPortal?: boolean;

  @ApiPropertyOptional({ example: ['evidence-1', 'evidence-2', 'evidence-3'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceFiles?: string[];

  @ApiPropertyOptional({ example: ['answer-1', 'answer-2', 'answer-3'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  questionnaireAnswers?: string[];

  @ApiPropertyOptional({ example: false, description: 'Whether this is a draft submission' })
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;
}

export class ShareToTrustPortalDto {
  @ApiProperty({ example: true, description: 'Whether to share to trust portal' })
  @IsBoolean()
  shareToTrustPortal: boolean;
}

export class UpdateQuestionnaireAnswerStatusDto {
  @ApiProperty({ enum: AnswerStatus, example: AnswerStatus.COMPLETED })
  @IsEnum(AnswerStatus)
  status: AnswerStatus;

  @ApiPropertyOptional({ example: true, description: 'Whether to share to trust portal when completed' })
  @IsOptional()
  @IsBoolean()
  shareToTrustPortal?: boolean;
} 