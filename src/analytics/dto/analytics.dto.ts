import { IsOptional, IsString, IsDateString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ 
    example: '7d',
    description: 'Time period for analytics (7d, 30d, 90d, 1y)',
    enum: ['7d', '30d', '90d', '1y']
  })
  @IsOptional()
  @IsString()
  @IsIn(['7d', '30d', '90d', '1y'])
  period?: string;

  @ApiPropertyOptional({ example: '2023-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2023-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    example: 'vendor',
    description: 'Type of analytics to retrieve',
    enum: ['vendor', 'questionnaire', 'evidence', 'trust-portal', 'compliance']
  })
  @IsOptional()
  @IsString()
  @IsIn(['vendor', 'questionnaire', 'evidence', 'trust-portal', 'compliance'])
  type?: string;
} 