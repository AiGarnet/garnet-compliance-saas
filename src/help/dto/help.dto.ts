import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class CreateHelpRequestDto {
  @IsUUID()
  vendorId: string;

  @IsString()
  question: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class HelpRequestResponseDto {
  id: string;
  vendorId: string;
  userQuestion: string;
  aiResponse: string;
  category: string;
  confidenceScore: number;
  isComplianceRelated: boolean;
  conversationContext?: any;
  metadata?: any;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ChatMessageDto {
  @IsString()
  question: string;

  @IsUUID()
  vendorId: string;

  @IsOptional()
  conversationHistory?: any[];
}

export class ChatResponseDto {
  answer: string;
  category: string;
  confidence: number;
  metadata: any;
  canRegenerate: boolean;
  isComplianceRelated: boolean;
  followUpSuggestions?: string[];
} 