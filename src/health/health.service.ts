import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  ping() {
    return {
      message: 'pong',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  getStatus() {
    return {
      status: 'ok',
      service: 'GarnetAI Compliance Backend API - NestJS',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      memory: process.memoryUsage(),
    };
  }

  getApiInfo() {
    return {
      status: 'ok',
      service: 'GarnetAI Compliance Backend API - NestJS',
      version: '2.0.0',
      description: 'Enterprise compliance management platform API',
      endpoints: {
        // System
        '/': 'API documentation',
        '/health': 'Health check',
        '/ping': 'Ping endpoint',
        '/status': 'Application status',
        '/api/docs': 'Swagger API documentation',
        
        // Authentication (3 endpoints)
        '/api/auth/signup': 'User registration',
        '/api/auth/login': 'User login',
        '/api/auth/profile': 'Get user profile',
        
        // Waitlist (4 endpoints)
        '/join-waitlist': 'Join waitlist (public)',
        '/api/waitlist/signup': 'Waitlist signup with authentication',
        '/api/waitlist/stats': 'Get waitlist statistics',
        '/api/waitlist/users': 'Get waitlist users',
        
        // Vendors (10 endpoints)
        '/api/vendors': 'Get all vendors / Create vendor',
        '/api/vendors/stats': 'Vendor statistics',
        '/api/vendors/status/:status': 'Get vendors by status',
        '/api/vendors/with-suggestions': 'Get vendors with AI suggestions',
        '/api/vendors/:id': 'Get/Update/Delete specific vendor',
        '/api/vendors/with-answers': 'Create vendor with questionnaire answers',
        '/api/vendors/:id/answers': 'Save questionnaire answers for vendor',
        
        // Questionnaires (7 endpoints)
        '/api/questionnaires': 'Get all questionnaires / Create questionnaire',
        '/api/questionnaires/:id': 'Get/Update/Delete specific questionnaire',
        '/api/questionnaires/:id/questions': 'Get/Update questionnaire questions',
        
        // Evidence (6 endpoints)
        '/api/evidence/vendors/:vendorId/evidence': 'Upload/Get vendor evidence files',
        '/api/evidence/vendors/:vendorId/evidence/count': 'Get evidence count',
        '/api/evidence/vendors/:vendorId/evidence/:evidenceId/download': 'Download evidence file',
        '/api/evidence/vendors/:vendorId/evidence/:evidenceId': 'Delete evidence file',
        '/api/evidence/answers/:answerId/evidence': 'Get answer evidence files',
        
        // Trust Portal (6 endpoints)
        '/api/trust-portal/vendors': 'Get vendors with trust portal items',
        '/api/trust-portal/items': 'Get/Create trust portal items',
        '/api/trust-portal/items/:id': 'Get/Update/Delete specific trust portal item',
        '/api/trust-portal/items/category/:category': 'Get trust portal items by category',
        
        // AI (5 endpoints)
        '/ask': 'Public AI question endpoint',
        '/api/ai/ask': 'AI answer generation (authenticated)',
        '/api/ai/batch-ask': 'Batch AI question processing',
        '/api/ai/suggestions': 'Create AI suggestion',
        '/api/ai/vendors/:vendorId/suggestions': 'Get vendor AI suggestions',
        
        // Analytics (10 endpoints)
        '/api/analytics/dashboard': 'Get comprehensive dashboard statistics',
        '/api/analytics/vendors': 'Get vendor analytics data',
        '/api/analytics/vendors/:vendorId': 'Get analytics for specific vendor',
        '/api/analytics/time-based': 'Get time-based analytics',
        '/api/analytics/risk-distribution': 'Get risk distribution analytics',
        '/api/analytics/stats/vendors': 'Get total vendor count',
        '/api/analytics/stats/questionnaires': 'Get total questionnaire count',
        '/api/analytics/vendors-by-status': 'Get vendor distribution by status',
        '/api/analytics/recent-activity': 'Get recent activity feed',
        '/api/analytics/compliance-overview': 'Get compliance overview statistics',
      },
      documentation: 'Visit /api/docs for complete API documentation',
      frontend: 'https://testinggarnet.netlify.app/',
      timestamp: new Date().toISOString(),
    };
  }
} 