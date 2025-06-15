import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {} 