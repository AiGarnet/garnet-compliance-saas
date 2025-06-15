import { Module } from '@nestjs/common';
import { QuestionnairesController } from './questionnaires.controller';
import { QuestionnairesService } from './questionnaires.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [QuestionnairesController],
  providers: [QuestionnairesService],
  exports: [QuestionnairesService],
})
export class QuestionnairesModule {} 