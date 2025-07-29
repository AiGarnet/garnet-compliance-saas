import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { FeatureAccessService } from './feature-access.service';
import { StripeCouponsService } from './stripe-coupons.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { CouponsModule } from '../coupons/coupons.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    forwardRef(() => CouponsModule),
  ],
  providers: [BillingService, FeatureAccessService, StripeCouponsService],
  controllers: [BillingController],
  exports: [BillingService, FeatureAccessService, StripeCouponsService],
})
export class BillingModule {} 