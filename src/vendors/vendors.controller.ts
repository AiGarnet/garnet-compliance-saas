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
  InternalServerErrorException,
  UseInterceptors
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { VendorStatus } from './entities/vendor.entity';
import { ActivityLoggingInterceptor } from '../common/interceptors/activity-logging.interceptor';
import { 
  LogClientCreated, 
  LogClientUpdated, 
  LogClientDeleted,
  CurrentUser,
  RequestMeta 
} from '../common/decorators/log-activity.decorator';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    [key: string]: any;
  };
}

@Controller('api/vendors')
@UseInterceptors(ActivityLoggingInterceptor)
export class VendorsController {
  private readonly logger = new Logger(VendorsController.name);

  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  @Public()
  async getAllVendors(): Promise<ApiResponse<any[]>> {
    try {
      const vendors = await this.vendorsService.findAll();
      return {
        success: true,
        data: vendors,
        meta: {
          timestamp: new Date().toISOString(),
          count: vendors.length
        }
      };
    } catch (error) {
      this.logger.error('Error getting vendors:', error);
      return {
        success: false,
        error: {
          code: 'FETCH_VENDORS_FAILED',
          message: 'Failed to retrieve vendors',
          details: error.message
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getVendor(@Param('id') id: string): Promise<ApiResponse<any>> {
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
        return {
          success: false,
          error: {
            code: 'VENDOR_NOT_FOUND',
            message: `Vendor with ID ${id} not found`
          },
          meta: {
            timestamp: new Date().toISOString(),
            vendorId: id
          }
        };
      }
      
      return {
        success: true,
        data: vendor,
        meta: {
          timestamp: new Date().toISOString(),
          vendorId: id
        }
      };
    } catch (error) {
      this.logger.error(`Error getting vendor ${id}:`, error);
      return {
        success: false,
        error: {
          code: 'FETCH_VENDOR_FAILED',
          message: 'Failed to retrieve vendor',
          details: error.message
        },
        meta: {
          timestamp: new Date().toISOString(),
          vendorId: id
        }
      };
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @LogClientCreated()
  async createVendor(
    @Body() createVendorDto: CreateVendorDto,
    @CurrentUser() user?: any,
    @RequestMeta() requestMeta?: any
  ): Promise<ApiResponse<any>> {
    try {
      const vendor = await this.vendorsService.create(createVendorDto);
      return {
        success: true,
        data: vendor,
        meta: {
          timestamp: new Date().toISOString(),
          operation: 'create',
          entityType: 'client',
          entityId: vendor.id || vendor.vendorId
        }
      };
    } catch (error) {
      this.logger.error('Error creating vendor:', error);
      return {
        success: false,
        error: {
          code: 'CREATE_VENDOR_FAILED',
          message: 'Failed to create vendor',
          details: error.message
        },
        meta: {
          timestamp: new Date().toISOString(),
          operation: 'create',
          entityType: 'client'
        }
      };
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @LogClientUpdated()
  async updateVendor(
    @Param('id') id: string,
    @Body() updateVendorDto: UpdateVendorDto,
    @CurrentUser() user?: any,
    @RequestMeta() requestMeta?: any
  ): Promise<ApiResponse<any>> {
    try {
      // Check if the ID is a number (vendor_id) or UUID
      const isNumericId = /^\d+$/.test(id);
      
      let vendor;
      let existingVendor;
      
      if (isNumericId) {
        existingVendor = await this.vendorsService.findById(parseInt(id));
        if (!existingVendor) {
          return {
            success: false,
            error: {
              code: 'VENDOR_NOT_FOUND',
              message: `Vendor with ID ${id} not found`
            },
            meta: {
              timestamp: new Date().toISOString(),
              operation: 'update',
              entityType: 'client',
              entityId: id
            }
          };
        }
        vendor = await this.vendorsService.update(parseInt(id), updateVendorDto);
      } else {
        // For UUID, we need to find the vendor first to get the numeric ID
        existingVendor = await this.vendorsService.findByUuid(id);
        if (!existingVendor) {
          return {
            success: false,
            error: {
              code: 'VENDOR_NOT_FOUND',
              message: `Vendor with ID ${id} not found`
            },
            meta: {
              timestamp: new Date().toISOString(),
              operation: 'update',
              entityType: 'client',
              entityId: id
            }
          };
        }
        vendor = await this.vendorsService.update(existingVendor.vendorId, updateVendorDto);
      }
      
      return {
        success: true,
        data: vendor,
        meta: {
          timestamp: new Date().toISOString(),
          operation: 'update',
          entityType: 'client',
          entityId: vendor.id || vendor.vendorId,
          previousStatus: existingVendor?.status,
          newStatus: vendor.status
        }
      };
    } catch (error) {
      this.logger.error(`Error updating vendor ${id}:`, error);
      return {
        success: false,
        error: {
          code: 'UPDATE_VENDOR_FAILED',
          message: 'Failed to update vendor',
          details: error.message
        },
        meta: {
          timestamp: new Date().toISOString(),
          operation: 'update',
          entityType: 'client',
          entityId: id
        }
      };
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @LogClientDeleted()
  async deleteVendor(
    @Param('id') id: string,
    @CurrentUser() user?: any,
    @RequestMeta() requestMeta?: any
  ): Promise<ApiResponse<any>> {
    try {
      // Check if the ID is a number (vendor_id) or UUID
      const isNumericId = /^\d+$/.test(id);
      
      let existingVendor;
      let success;
      
      if (isNumericId) {
        existingVendor = await this.vendorsService.findById(parseInt(id));
        if (!existingVendor) {
          return {
            success: false,
            error: {
              code: 'VENDOR_NOT_FOUND',
              message: `Vendor with ID ${id} not found`
            },
            meta: {
              timestamp: new Date().toISOString(),
              operation: 'delete',
              entityType: 'client',
              entityId: id
            }
          };
        }
        success = await this.vendorsService.delete(parseInt(id));
      } else {
        // For UUID, we need to find the vendor first to get the numeric ID
        existingVendor = await this.vendorsService.findByUuid(id);
        if (!existingVendor) {
          return {
            success: false,
            error: {
              code: 'VENDOR_NOT_FOUND',
              message: `Vendor with ID ${id} not found`
            },
            meta: {
              timestamp: new Date().toISOString(),
              operation: 'delete',
              entityType: 'client',
              entityId: id
            }
          };
        }
        success = await this.vendorsService.delete(existingVendor.vendorId);
      }
      
      if (!success) {
        return {
          success: false,
          error: {
            code: 'DELETE_FAILED',
            message: `Failed to delete vendor with ID ${id}`
          },
          meta: {
            timestamp: new Date().toISOString(),
            operation: 'delete',
            entityType: 'client',
            entityId: id
          }
        };
      }
      
      return {
        success: true,
        data: { 
          message: 'Client deleted successfully',
          deletedId: id,
          deletedName: existingVendor.name
        },
        meta: {
          timestamp: new Date().toISOString(),
          operation: 'delete',
          entityType: 'client',
          entityId: id,
          entityName: existingVendor.name
        }
      };
    } catch (error) {
      this.logger.error(`Error deleting vendor ${id}:`, error);
      return {
        success: false,
        error: {
          code: 'DELETE_VENDOR_FAILED',
          message: 'Failed to delete vendor',
          details: error.message
        },
        meta: {
          timestamp: new Date().toISOString(),
          operation: 'delete',
          entityType: 'client',
          entityId: id
        }
      };
    }
  }

  @Public()
  @Get('health/check')
  async healthCheck(): Promise<ApiResponse<any>> {
    return {
      success: true,
      data: { 
        message: 'Vendors service is healthy',
        service: 'vendors',
        status: 'healthy'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }
} 