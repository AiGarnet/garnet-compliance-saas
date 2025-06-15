import { IsString, IsEmail, IsOptional, IsEnum, IsNumber, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VendorStatus, RiskLevel } from '../entities/vendor.entity';

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

  @ApiPropertyOptional({ example: 75, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  riskScore?: number;

  @ApiPropertyOptional({ enum: RiskLevel, example: RiskLevel.MEDIUM })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

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

  @ApiPropertyOptional({ example: 85, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  riskScore?: number;

  @ApiPropertyOptional({ enum: RiskLevel, example: RiskLevel.LOW })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

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
}

export class CreateVendorWithAnswersDto extends CreateVendorDto {
  @ApiProperty({ type: [VendorQuestionnaireAnswerDto] })
  answers: VendorQuestionnaireAnswerDto[];
} 