import { Module } from '@nestjs/common';
import { TrustPortalController } from './trust-portal.controller';
import { TrustPortalService } from './trust-portal.service';
import { DatabaseModule } from '../database/database.module';
import { VendorsModule } from '../vendors/vendors.module';

@Module({
  imports: [DatabaseModule, VendorsModule],
  controllers: [TrustPortalController],
  providers: [TrustPortalService],
  exports: [TrustPortalService],
})
export class TrustPortalModule {} 