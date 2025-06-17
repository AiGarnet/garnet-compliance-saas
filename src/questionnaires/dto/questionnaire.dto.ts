import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsArray, ValidateNested, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionnaireStatus } from '../entities/questionnaire.entity';

export class CreateQuestionDto {
  @ApiProperty({ example: 'What is your data retention policy?' })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsNumber()
  @Min(1)
  questionOrder: number;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean = false;
}

export class CreateQuestionnaireDto {
  @ApiProperty({ example: 'Security Assessment Questionnaire' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 1, description: 'Vendor ID to associate with questionnaire' })
  @IsOptional()
  @IsNumber()
  vendorId?: number;

  @ApiProperty({ type: [CreateQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}

export class UpdateQuestionnaireDto {
  @ApiPropertyOptional({ example: 'Updated Security Assessment' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: QuestionnaireStatus, example: QuestionnaireStatus.IN_PROGRESS })
  @IsOptional()
  @IsEnum(QuestionnaireStatus)
  status?: QuestionnaireStatus;
}

export class UpdateQuestionDto {
  @ApiPropertyOptional({ example: 'Updated question text?' })
  @IsOptional()
  @IsString()
  questionText?: string;

  @ApiPropertyOptional({ example: 'Updated answer text' })
  @IsOptional()
  @IsString()
  answer?: string;

  @ApiPropertyOptional({ example: 2, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  questionOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
} 