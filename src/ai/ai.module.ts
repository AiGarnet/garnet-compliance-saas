import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '@nestjs/config';
import { DigitalOceanSpacesService } from '../common/services/digitalocean-spaces.service';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [AiController],
  providers: [AiService, DigitalOceanSpacesService],
  exports: [AiService],
})
export class AiModule {} 