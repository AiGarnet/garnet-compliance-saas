import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';
import { EvidenceFile } from './entities/evidence.entity';
import { DatabaseModule } from '../database/database.module';
import { DigitalOceanSpacesService } from '../common/services/digitalocean-spaces.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EvidenceFile]),
    DatabaseModule,
  ],
  controllers: [EvidenceController],
  providers: [EvidenceService, DigitalOceanSpacesService],
  exports: [EvidenceService],
})
export class EvidenceModule {} 