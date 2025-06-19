import { Module } from '@nestjs/common';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { DatabaseModule } from '../database/database.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [DatabaseModule, ActivitiesModule],
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {} 