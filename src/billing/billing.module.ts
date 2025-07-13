import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { FeatureAccessService } from './feature-access.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
  ],
  providers: [BillingService, FeatureAccessService],
  controllers: [BillingController],
  exports: [BillingService, FeatureAccessService],
})
export class BillingModule {} 