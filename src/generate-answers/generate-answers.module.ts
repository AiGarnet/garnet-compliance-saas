import { Module } from '@nestjs/common';
import { GenerateAnswersController } from './generate-answers.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [GenerateAnswersController],
})
export class GenerateAnswersModule {} 