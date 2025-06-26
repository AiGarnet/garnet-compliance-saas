import { Module } from '@nestjs/common';
import { AnswerController } from './answer.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [AnswerController],
})
export class AnswerModule {} 