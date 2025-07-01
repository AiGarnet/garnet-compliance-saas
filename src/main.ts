// Import polyfills first to ensure they're loaded before any other modules
import './polyfills';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration - same as Express version
  app.enableCors({
    origin: [
      'https://testinggarnet.netlify.app',
      'https://garnetai.net',
      'https://www.garnetai.net',
      /\.netlify\.app$/,
      /\.garnetai\.net$/,
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('GarnetAI Compliance API')
    .setDescription('Enterprise compliance management platform API - NestJS Version')
    .setVersion('2.0.0')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Vendors', 'Vendor management operations')
    .addTag('Questionnaires', 'Questionnaire and compliance management')
    .addTag('Evidence', 'Evidence file upload and management')
    .addTag('Trust Portal', 'Public trust portal operations')
    .addTag('Waitlist', 'Waitlist management')
    .addTag('AI & Chatbot', 'AI-powered compliance assistance')
    .addTag('Analytics', 'Analytics and reporting')
    .addTag('Health', 'System health and monitoring')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Get port from environment or default to 8080 (Railway compatible)
  const port = configService.get<number>('PORT') || 8080;

  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 GarnetAI NestJS Backend running on port ${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`🏥 Health Check: http://localhost:${port}/health`);
  logger.log(`🌍 Environment: ${configService.get('NODE_ENV') || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
}); 