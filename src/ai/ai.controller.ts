import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { GenerateAnswerDto, BatchAnswerDto, CreateSuggestionDto } from './dto/ai.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('ai')
@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('ask')
  @Public()
  @ApiOperation({ summary: 'Generate AI answer for a single question (public endpoint)' })
  @ApiResponse({ status: 200, description: 'AI answer generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or OpenAI not configured' })
  async askPublic(@Body() generateAnswerDto: GenerateAnswerDto) {
    try {
      const result = await this.aiService.generateAnswer({
        question: generateAnswerDto.question,
        context: generateAnswerDto.context,
        vendorId: generateAnswerDto.vendorId,
      });

      return { answer: result.answer };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to generate AI answer',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('api/answer')
  @Public()
  @ApiOperation({ summary: 'Generate AI answer for frontend compatibility' })
  @ApiResponse({ status: 200, description: 'AI answer generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or OpenAI not configured' })
  async answerQuestion(@Body() generateAnswerDto: GenerateAnswerDto) {
    try {
      const result = await this.aiService.generateAnswer({
        question: generateAnswerDto.question,
        context: generateAnswerDto.context,
        vendorId: generateAnswerDto.vendorId,
      });

      return { answer: result.answer };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to generate AI answer',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('api/ai/ask')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate AI answer for a single question (authenticated)' })
  @ApiResponse({ status: 200, description: 'AI answer generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or OpenAI not configured' })
  async generateAnswer(@Body() generateAnswerDto: GenerateAnswerDto) {
    try {
      const result = await this.aiService.generateAnswer({
        question: generateAnswerDto.question,
        context: generateAnswerDto.context,
        vendorId: generateAnswerDto.vendorId,
      });

      return result;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to generate AI answer',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('api/ai/batch-ask')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate AI answers for multiple questions' })
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
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to generate AI answers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('api/ai/suggestions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create AI suggestion for a vendor' })
  @ApiResponse({ status: 201, description: 'AI suggestion created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createSuggestion(@Body() createSuggestionDto: CreateSuggestionDto) {
    try {
      const suggestion = await this.aiService.createSuggestion(createSuggestionDto);
      return { suggestion };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to create AI suggestion',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('api/ai/vendors/:vendorId/suggestions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get AI suggestions for a vendor' })
  @ApiResponse({ status: 200, description: 'Returns vendor AI suggestions' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async getVendorSuggestions(@Param('vendorId') vendorId: string) {
    try {
      const vendorIdNum = parseInt(vendorId);
      if (isNaN(vendorIdNum)) {
        throw new HttpException('Invalid vendor ID', HttpStatus.BAD_REQUEST);
      }

      const suggestions = await this.aiService.getVendorSuggestions(vendorIdNum);
      return {
        suggestions,
        count: suggestions.length,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to get vendor suggestions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 