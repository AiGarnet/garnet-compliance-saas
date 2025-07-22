import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { DocumentGeneratorService } from './services/document-generator.service';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '@nestjs/config';
import { DigitalOceanSpacesService } from '../common/services/digitalocean-spaces.service';
import { EvidenceModule } from '../evidence/evidence.module';

@Module({
  imports: [DatabaseModule, ConfigModule, EvidenceModule],
  controllers: [AiController],
  providers: [AiService, DocumentGeneratorService, DigitalOceanSpacesService],
  exports: [AiService],
})
export class AiModule {} 