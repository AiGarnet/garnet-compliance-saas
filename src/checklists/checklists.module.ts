import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistsController } from './checklists.controller';
import { ChecklistsService } from './checklists.service';
import { Checklist, ChecklistQuestion, ChecklistSupportingDocument } from './entities/checklist.entity';
import { AiModule } from '../ai/ai.module';

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
  providers: [ChecklistsService],
  exports: [ChecklistsService]
})
export class ChecklistsModule {} 