import { IsString, IsOptional, IsArray, IsNumber, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateAnswerDto {
  @ApiProperty({ example: 'What is your data retention policy?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional({ example: 'This is for a financial services vendor' })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional({ example: 123 })
  @IsOptional()
  @IsNumber()
  vendorId?: number;

  @ApiPropertyOptional({ 
    example: ['uuid1', 'uuid2'], 
    description: 'Array of evidence file IDs to use for enhanced response generation'
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedEvidenceFiles?: string[];
}

export class BatchAnswerDto {
  @ApiProperty({ example: ['What is your data retention policy?', 'How do you handle data breaches?'] })
  @IsArray()
  @IsString({ each: true })
  questions: string[];

  @ApiPropertyOptional({ example: 'This is for a financial services vendor' })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional({ example: 123 })
  @IsOptional()
  @IsNumber()
  vendorId?: number;
}

export class GenerateSupportingDocumentDto {
  @ApiProperty({ example: 'Data Retention Policy' })
  @IsString()
  @IsNotEmpty()
  documentTitle: string;

  @ApiPropertyOptional({ example: 'Please generate a comprehensive data retention policy' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ example: 'Data Privacy' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 123 })
  @IsOptional()
  @IsNumber()
  vendorId?: number;

  @ApiPropertyOptional({ example: 'q123-456-789' })
  @IsOptional()
  @IsString()
  questionId?: string;
}

export class CreateSuggestionDto {
  @ApiProperty({ example: 123 })
  @IsNumber()
  vendorId: number;

  @ApiPropertyOptional({ example: 'Q001' })
  @IsOptional()
  @IsString()
  questionId?: string;

  @ApiProperty({ example: 'Consider implementing multi-factor authentication' })
  @IsString()
  @IsNotEmpty()
  suggestion: string;

  @ApiProperty({ example: 0.85, minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @ApiProperty({ example: 'security' })
  @IsString()
  @IsNotEmpty()
  category: string;
} 