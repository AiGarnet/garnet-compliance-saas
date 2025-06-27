import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistsController } from './checklists.controller';
import { ChecklistsService } from './checklists.service';
import { Checklist, ChecklistQuestion, ChecklistSupportingDocument } from './entities/checklist.entity';
import { AiModule } from '../ai/ai.module';
import { DigitalOceanSpacesService } from '../common/services/digitalocean-spaces.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Checklist,
      ChecklistQuestion,
      ChecklistSupportingDocument
    ]),
    AiModule
  ],
  controllers: [ChecklistsController],
  providers: [ChecklistsService, DigitalOceanSpacesService],
  exports: [ChecklistsService]
})
export class ChecklistsModule {} 