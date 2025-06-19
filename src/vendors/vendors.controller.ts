import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { VendorStatus } from './entities/vendor.entity';

@Controller('vendors')
export class VendorsController {
  private readonly logger = new Logger(VendorsController.name);

  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllVendors() {
    try {
      const vendors = await this.vendorsService.findAll();
      return { vendors };
    } catch (error) {
      this.logger.error('Error getting vendors:', error);
      throw new InternalServerErrorException('Failed to retrieve vendors');
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getVendor(@Param('id') id: string) {
    try {
      // Check if the ID is a number (vendor_id) or UUID
      const isNumericId = /^\d+$/.test(id);
      
      let vendor;
      if (isNumericId) {
        vendor = await this.vendorsService.findById(parseInt(id));
      } else {
        vendor = await this.vendorsService.findByUuid(id);
      }
      
      if (!vendor) {
        throw new NotFoundException(`Vendor with ID ${id} not found`);
      }
      
      return vendor;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error getting vendor ${id}:`, error);
      throw new InternalServerErrorException('Failed to retrieve vendor');
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createVendor(@Body() createVendorDto: CreateVendorDto) {
    try {
      const vendor = await this.vendorsService.create(createVendorDto);
      return vendor;
    } catch (error) {
      this.logger.error('Error creating vendor:', error);
      throw new InternalServerErrorException('Failed to create vendor');
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateVendor(
    @Param('id') id: string,
    @Body() updateVendorDto: UpdateVendorDto
  ) {
    try {
      // Check if the ID is a number (vendor_id) or UUID
      const isNumericId = /^\d+$/.test(id);
      
      let vendor;
      if (isNumericId) {
        vendor = await this.vendorsService.update(parseInt(id), updateVendorDto);
      } else {
        // For UUID, we need to find the vendor first to get the numeric ID
        const existingVendor = await this.vendorsService.findByUuid(id);
        if (!existingVendor) {
          throw new NotFoundException(`Vendor with ID ${id} not found`);
        }
        vendor = await this.vendorsService.update(existingVendor.vendorId, updateVendorDto);
      }
      
      return vendor;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error updating vendor ${id}:`, error);
      throw new InternalServerErrorException('Failed to update vendor');
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteVendor(@Param('id') id: string) {
    try {
      // Check if the ID is a number (vendor_id) or UUID
      const isNumericId = /^\d+$/.test(id);
      
      let success;
      if (isNumericId) {
        success = await this.vendorsService.delete(parseInt(id));
      } else {
        // For UUID, we need to find the vendor first to get the numeric ID
        const existingVendor = await this.vendorsService.findByUuid(id);
        if (!existingVendor) {
          throw new NotFoundException(`Vendor with ID ${id} not found`);
        }
        success = await this.vendorsService.delete(existingVendor.vendorId);
      }
      
      if (!success) {
        throw new NotFoundException(`Vendor with ID ${id} not found`);
      }
      
      return { message: 'Vendor deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error deleting vendor ${id}:`, error);
      throw new InternalServerErrorException('Failed to delete vendor');
    }
  }

  @Public()
  @Get('health/check')
  async healthCheck() {
    return { message: 'Vendors service is healthy', timestamp: new Date().toISOString() };
  }
} 