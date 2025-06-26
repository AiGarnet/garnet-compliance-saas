import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('general')
@Controller()
@Public()
export class AppController {
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

  @Get('favicon.ico')
  @ApiOperation({ summary: 'Favicon endpoint' })
  @ApiResponse({ status: 204, description: 'No content' })
  favicon() {
    // Return 204 No Content for favicon requests to prevent 404 errors
    return;
  }
} 