import { Module } from '@nestjs/common';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { RiskAssessmentService } from './services/risk-assessment.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [VendorsController],
  providers: [VendorsService, RiskAssessmentService],
  exports: [VendorsService, RiskAssessmentService],
})
export class VendorsModule {} 