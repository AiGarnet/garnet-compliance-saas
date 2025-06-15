import { IsString, IsOptional, IsNumber, IsNotEmpty, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrustPortalCategory } from '../entities/trust-portal.entity';

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