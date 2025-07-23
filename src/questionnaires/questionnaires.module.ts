import { Module } from '@nestjs/common';
import { QuestionnairesController } from './questionnaires.controller';
import { QuestionnairesService } from './questionnaires.service';
import { DatabaseModule } from '../database/database.module';
import { AiModule } from '../ai/ai.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [DatabaseModule, AiModule, BillingModule],
  controllers: [QuestionnairesController],
  providers: [QuestionnairesService],
  exports: [QuestionnairesService],
})
export class QuestionnairesModule {} 