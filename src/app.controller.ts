import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';
import { AiService } from './ai/ai.service';

@ApiTags('general')
@Controller()
@Public()
export class AppController {
  constructor(private readonly aiService: AiService) {}
  @Get()
  @ApiOperation({ summary: 'API root endpoint - API information and documentation links' })
  @ApiResponse({ status: 200, description: 'API information and documentation links' })
  getRoot() {
    return {
      message: 'GarnetAI NestJS Backend API - Phase 4 Complete',
      version: '2.0.0',
      description: 'Enterprise compliance management platform API',
      status: 'online',
      documentation: '/api/docs',
      health: '/health/status',
      endpoints: {
        documentation: '/api/docs',
        health: '/health',
        ping: '/health/ping',
        status: '/health/status',
      },
      totalEndpoints: 56,
      modules: [
        'Authentication',
        'Waitlist', 
        'Vendors',
        'Questionnaires',
        'Evidence',
        'Trust Portal',
        'AI & Chatbot',
        'Analytics',
        'Activities'
      ],
      timestamp: new Date().toISOString()
    };
  }

  @Post('ask')
  @ApiOperation({ summary: 'Public AI ask endpoint for quick compliance questions' })
  @ApiResponse({ status: 200, description: 'AI answer generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid question or AI service unavailable' })
  async ask(@Body() body: { question: string; context?: string }) {
    try {
      if (!body.question) {
        return { error: 'Question is required' };
      }

      const result = await this.aiService.generateAnswer({
        question: body.question,
        context: body.context || 'General compliance inquiry',
        vendorId: null,
      });

      return { 
        question: body.question,
        answer: result.answer,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return { 
        question: body.question,
        answer: 'We apologize, but we couldn\'t generate a response at this time. Please contact our compliance team directly for this information.',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('favicon.ico')
  @ApiOperation({ summary: 'Favicon endpoint' })
  @ApiResponse({ status: 204, description: 'No content' })
  favicon() {
    // Return 204 No Content for favicon requests to prevent 404 errors
    return;
  }
} 