import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { DatabaseModule } from '../database/database.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [DatabaseModule, OrganizationsModule],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService, AdminGuard],
})
export class AdminModule {} 