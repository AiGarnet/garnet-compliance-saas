import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { Activity } from './entities/activity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity])
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService] // Export for use in other modules
})
export class ActivitiesModule {} 