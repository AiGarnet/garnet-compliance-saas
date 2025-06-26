import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiService } from '../ai/ai.service';
import { BatchAnswerDto } from '../ai/dto/ai.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('generate-answers')
@Controller('api/generate-answers')
@Public()
export class GenerateAnswersController {
  constructor(private readonly aiService: AiService) {}

  @Post()
  @ApiOperation({ summary: 'Generate AI answers for multiple questions - Frontend Batch Route' })
  @ApiResponse({ status: 200, description: 'AI answers generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or OpenAI not configured' })
  async generateBatchAnswers(@Body() batchAnswerDto: BatchAnswerDto) {
    try {
      const result = await this.aiService.generateBatchAnswers({
        questions: batchAnswerDto.questions,
        context: batchAnswerDto.context,
        vendorId: batchAnswerDto.vendorId,
      });

      return result;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to generate AI answers');
    }
  }
} 