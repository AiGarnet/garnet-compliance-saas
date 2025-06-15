import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  DiskHealthIndicator,
  MemoryHealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { DatabaseService } from '../database/database.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('health')
@Controller()
@Public()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private databaseService: DatabaseService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Health check results' })
  @HealthCheck()
  check() {
    return this.health.check([
      // Database health check
      () => this.checkDatabase(),
      
      // Memory health check - 500MB heap, 1GB RSS (more lenient for development)
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 1024 * 1024 * 1024),
      
      // Disk health check - More lenient threshold for development
      () => this.disk.checkStorage('storage', { 
        path: process.platform === 'win32' ? 'C:\\' : '/', 
        thresholdPercent: 0.98 // 98% threshold instead of 90%
      }),
    ]);
  }

  @Get('ping')
  @ApiOperation({ summary: 'Simple ping endpoint' })
  @ApiResponse({ status: 200, description: 'Pong response' })
  ping() {
    return { message: 'pong', timestamp: new Date().toISOString() };
  }

  @Get('status')
  @ApiOperation({ summary: 'Application status' })
  @ApiResponse({ status: 200, description: 'Application status information' })
  async status() {
    const dbStatus = await this.checkDatabaseStatus();
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: dbStatus,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
      },
    };
  }

  @Get('favicon.ico')
  @ApiOperation({ summary: 'Favicon endpoint' })
  @ApiResponse({ status: 204, description: 'No content' })
  favicon() {
    // Return 204 No Content for favicon requests to prevent 404 errors
    return;
  }

  @Get('/')
  @ApiOperation({ summary: 'API documentation redirect' })
  @ApiResponse({ status: 200, description: 'API information and documentation links' })
  root() {
    return {
      message: 'GarnetAI NestJS Backend API - Phase 4 Complete',
      version: '2.0.0',
      description: 'Enterprise compliance management platform API',
      documentation: '/api/docs',
      health: '/health',
      totalEndpoints: 56,
      modules: {
        // Authentication (3 endpoints)
        auth: {
          base: '/api/auth',
          endpoints: [
            'POST /api/auth/signup',
            'POST /api/auth/login', 
            'GET /api/auth/profile'
          ]
        },
        
        // Waitlist (4 endpoints)
        waitlist: {
          base: '/api/waitlist',
          endpoints: [
            'POST /join-waitlist',
            'POST /api/waitlist/signup',
            'GET /api/waitlist/stats',
            'GET /api/waitlist/users'
          ]
        },
        
        // Vendors (10 endpoints)
        vendors: {
          base: '/api/vendors',
          endpoints: [
            'GET /api/vendors',
            'POST /api/vendors',
            'GET /api/vendors/stats',
            'GET /api/vendors/status/:status',
            'GET /api/vendors/with-suggestions',
            'GET /api/vendors/:id',
            'PUT /api/vendors/:id',
            'DELETE /api/vendors/:id',
            'POST /api/vendors/with-answers',
            'POST /api/vendors/:id/answers'
          ]
        },
        
        // Questionnaires (7 endpoints)
        questionnaires: {
          base: '/api/questionnaires',
          endpoints: [
            'POST /api/questionnaires',
            'GET /api/questionnaires',
            'GET /api/questionnaires/:id',
            'PUT /api/questionnaires/:id',
            'DELETE /api/questionnaires/:id',
            'GET /api/questionnaires/:id/questions',
            'PUT /api/questionnaires/:id/questions/:questionId'
          ]
        },
        
        // Evidence (6 endpoints)
        evidence: {
          base: '/api/evidence',
          endpoints: [
            'POST /api/evidence/vendors/:vendorId/evidence',
            'GET /api/evidence/vendors/:vendorId/evidence',
            'GET /api/evidence/vendors/:vendorId/evidence/count',
            'GET /api/evidence/vendors/:vendorId/evidence/:evidenceId/download',
            'DELETE /api/evidence/vendors/:vendorId/evidence/:evidenceId',
            'GET /api/evidence/answers/:answerId/evidence'
          ]
        },
        
        // Trust Portal (6 endpoints)
        trustPortal: {
          base: '/api/trust-portal',
          endpoints: [
            'GET /api/trust-portal/vendors',
            'GET /api/trust-portal/items',
            'POST /api/trust-portal/items',
            'GET /api/trust-portal/items/:id',
            'PUT /api/trust-portal/items/:id',
            'DELETE /api/trust-portal/items/:id',
            'GET /api/trust-portal/items/category/:category'
          ]
        },
        
        // AI (5 endpoints)
        ai: {
          base: '/api/ai',
          endpoints: [
            'POST /ask (public)',
            'POST /api/ai/ask',
            'POST /api/ai/batch-ask',
            'POST /api/ai/suggestions',
            'GET /api/ai/vendors/:vendorId/suggestions'
          ]
        },
        
        // Analytics (10 endpoints)
        analytics: {
          base: '/api/analytics',
          endpoints: [
            'GET /api/analytics/dashboard',
            'GET /api/analytics/vendors',
            'GET /api/analytics/vendors/:vendorId',
            'GET /api/analytics/time-based',
            'GET /api/analytics/risk-distribution',
            'GET /api/analytics/stats/vendors',
            'GET /api/analytics/stats/questionnaires',
            'GET /api/analytics/vendors-by-status',
            'GET /api/analytics/recent-activity',
            'GET /api/analytics/compliance-overview'
          ]
        },
        
        // Health & System (5 endpoints)
        system: {
          base: '/',
          endpoints: [
            'GET /',
            'GET /health',
            'GET /ping',
            'GET /status',
            'GET /api/docs'
          ]
        }
      },
      database: 'PostgreSQL on Railway',
      frontend: 'https://testinggarnet.netlify.app/',
      environment: process.env.NODE_ENV || 'development'
    };
  }

  private async checkDatabase(): Promise<HealthIndicatorResult> {
    try {
      await this.databaseService.query('SELECT 1');
      return {
        database: {
          status: 'up',
          message: 'Database connection successful',
        },
      };
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  private async checkDatabaseStatus() {
    try {
      await this.databaseService.query('SELECT 1');
      return {
        status: 'up',
        message: 'Database connection successful',
      };
    } catch (error) {
      return {
        status: 'down',
        message: `Database connection failed: ${error.message}`,
      };
    }
  }
} 