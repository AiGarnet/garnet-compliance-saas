import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// Configuration
import { DatabaseModule } from './database/database.module';
import { configuration } from './config/configuration';

// Core modules
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

// Feature modules
import { VendorsModule } from './vendors/vendors.module';
import { QuestionnairesModule } from './questionnaires/questionnaires.module';
import { EvidenceModule } from './evidence/evidence.module';
import { TrustPortalModule } from './trust-portal/trust-portal.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { AiModule } from './ai/ai.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ActivitiesModule } from './activities/activities.module';
import { AnswerModule } from './answer/answer.module';
import { GenerateAnswersModule } from './generate-answers/generate-answers.module';
import { ChecklistsModule } from './checklists/checklists.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { HelpModule } from './help/help.module';
import { BillingModule } from './billing/billing.module';
import { AdminModule } from './admin/admin.module';

// Global providers
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

// Root controller
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Rate limiting
    ThrottlerModule.forRoot({
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }),

    // Core infrastructure
    DatabaseModule,
    AuthModule,
    HealthModule,

    // Feature modules
    VendorsModule,
    QuestionnairesModule,
    EvidenceModule,
    TrustPortalModule,
    WaitlistModule,
    AiModule,
    AnalyticsModule,
    ActivitiesModule,
    AnswerModule,
    GenerateAnswersModule,
    ChecklistsModule,
    OrganizationsModule,
    HelpModule,
    BillingModule,
    AdminModule,
  ],
  providers: [
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },

    // Global logging interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },

    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // Global guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {} 