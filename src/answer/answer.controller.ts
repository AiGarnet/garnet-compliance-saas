import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiService } from '../ai/ai.service';
import { GenerateAnswerDto } from '../ai/dto/ai.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('answer')
@Controller('api/answer')
@Public()
export class AnswerController {
  constructor(private readonly aiService: AiService) {}

  @Post()
  @ApiOperation({ summary: 'Generate AI answer for a single question - Frontend Route' })
  @ApiResponse({ status: 200, description: 'AI answer generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or OpenAI not configured' })
  async generateAnswer(@Body() generateAnswerDto: GenerateAnswerDto) {
    try {
      const result = await this.aiService.generateAnswer({
        question: generateAnswerDto.question,
        context: generateAnswerDto.context,
        vendorId: generateAnswerDto.vendorId,
      });

      return { answer: result.answer };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to generate AI answer');
    }
  }
} 