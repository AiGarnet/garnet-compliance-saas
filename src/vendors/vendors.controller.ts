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
  @UseGuards(JwtAuthGuard) // SECURITY FIX: Remove @Public() and require authentication
  async getAllVendors(
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any[]>> {
    try {
      // SECURITY FIX: Only show vendors from user's organization
      if (!user?.organization_id) {
        return {
          success: false,
          error: {
            code: 'MISSING_ORGANIZATION',
            message: 'User must belong to an organization to access vendors'
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        };
      }

      const vendors = await this.vendorsService.findAllByOrganization(user.organization_id);
      return {
        success: true,
        data: vendors,
        meta: {
          timestamp: new Date().toISOString(),
          count: vendors.length,
          organizationId: user.organization_id
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
  @UseGuards(JwtAuthGuard) // SECURITY FIX: Remove @Public() and require authentication
  async getVendor(
    @Param('id') id: string,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    try {
      // SECURITY FIX: Ensure user belongs to an organization
      if (!user?.organization_id) {
        return {
          success: false,
          error: {
            code: 'MISSING_ORGANIZATION',
            message: 'User must belong to an organization to access vendors'
          },
          meta: {
            timestamp: new Date().toISOString(),
            vendorId: id
          }
        };
      }

      // Check if the ID is a number (vendor_id) or UUID
      const isNumericId = /^\d+$/.test(id);
      
      let vendor;
      if (isNumericId) {
        // SECURITY FIX: Only allow access to vendors from same organization
        vendor = await this.vendorsService.findById(parseInt(id), user.organization_id);
      } else {
        // SECURITY FIX: Only allow access to vendors from same organization
        vendor = await this.vendorsService.findByUuid(id, user.organization_id);
      }
      
      if (!vendor) {
        return {
          success: false,
          error: {
            code: 'VENDOR_NOT_FOUND',
            message: `Vendor with ID ${id} not found or you don't have access to it`
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
          vendorId: id,
          organizationId: user.organization_id
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
  @UseGuards(JwtAuthGuard) // SECURITY FIX: Remove @Public() and require authentication
  @LogClientCreated()
  async createVendor(
    @Body() createVendorDto: CreateVendorDto,
    @CurrentUser() user?: any,
    @RequestMeta() requestMeta?: any
  ): Promise<ApiResponse<any>> {
    try {
      // SECURITY FIX: Ensure user belongs to an organization
      if (!user?.organization_id) {
        return {
          success: false,
          error: {
            code: 'MISSING_ORGANIZATION',
            message: 'User must belong to an organization to create vendors'
          },
          meta: {
            timestamp: new Date().toISOString(),
            operation: 'create',
            entityType: 'client'
          }
        };
      }

      // SECURITY FIX: Auto-populate organization and user context
      const vendorData = {
        ...createVendorDto,
        organizationId: user.organization_id,
        createdByUserId: user.id
      };

      const vendor = await this.vendorsService.create(vendorData);
      return {
        success: true,
        data: vendor,
        meta: {
          timestamp: new Date().toISOString(),
          operation: 'create',
          entityType: 'client',
          entityId: vendor.id || vendor.vendorId,
          organizationId: user.organization_id,
          createdByUserId: user.id
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
        // SECURITY FIX: Only allow access to vendors from same organization
        if (user?.organization_id) {
          existingVendor = await this.vendorsService.findById(parseInt(id), user.organization_id);
          if (!existingVendor) {
            return {
              success: false,
              error: {
                code: 'VENDOR_NOT_FOUND',
                message: `Vendor with ID ${id} not found or you don't have access to it`
              },
              meta: {
                timestamp: new Date().toISOString(),
                vendorId: id,
                operation: 'update'
              }
            };
          }
          
          // SECURITY FIX: Auto-populate organization and user context
          const vendorData = {
            ...updateVendorDto,
            organizationId: user.organization_id,
            updatedByUserId: user.id
          };
          
          vendor = await this.vendorsService.update(parseInt(id), vendorData);
        } else {
          return {
            success: false,
            error: {
              code: 'MISSING_ORGANIZATION',
              message: 'User must belong to an organization to update vendors'
            },
            meta: {
              timestamp: new Date().toISOString(),
              vendorId: id,
              operation: 'update'
            }
          };
        }
      } else {
        // SECURITY FIX: Only allow access to vendors from same organization
        if (user?.organization_id) {
          existingVendor = await this.vendorsService.findByUuid(id, user.organization_id);
          if (!existingVendor) {
            return {
              success: false,
              error: {
                code: 'VENDOR_NOT_FOUND',
                message: `Vendor with ID ${id} not found or you don't have access to it`
              },
              meta: {
                timestamp: new Date().toISOString(),
                vendorId: id,
                operation: 'update'
              }
            };
          }
          
          // SECURITY FIX: Auto-populate organization and user context
          const vendorData = {
            ...updateVendorDto,
            organizationId: user.organization_id,
            updatedByUserId: user.id
          };
          
          vendor = await this.vendorsService.update(existingVendor.vendorId, vendorData);
        } else {
          return {
            success: false,
            error: {
              code: 'MISSING_ORGANIZATION',
              message: 'User must belong to an organization to update vendors'
            },
            meta: {
              timestamp: new Date().toISOString(),
              vendorId: id,
              operation: 'update'
            }
          };
        }
      }
      
      return {
        success: true,
        data: vendor,
        meta: {
          timestamp: new Date().toISOString(),
          vendorId: id,
          operation: 'update',
          entityType: 'client',
          entityId: vendor.id || vendor.vendorId,
          organizationId: user?.organization_id,
          updatedByUserId: user?.id
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
          vendorId: id,
          operation: 'update',
          entityType: 'client'
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

  @Post(':id/trust-portal/invite')
  @Public()
  async generateInviteLink(@Param('id') id: string): Promise<ApiResponse<any>> {
    try {
      // Check if the ID is a number (vendor_id) or UUID
      const isNumericId = /^\d+$/.test(id);
      
      let vendorId: number;
      
      if (isNumericId) {
        vendorId = parseInt(id);
      } else {
        // For UUID, we need to find the vendor first to get the numeric ID
        const vendor = await this.vendorsService.findByUuid(id);
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
        vendorId = vendor.vendorId;
      }

      // Check if there's already an active invite token
      const existingToken = await this.vendorsService.getActiveInviteToken(vendorId);
      
      if (existingToken) {
        return {
          success: true,
          data: {
            token: existingToken.token,
            expiresAt: existingToken.expiresAt,
            inviteLink: existingToken.inviteLink,
            message: 'Using existing active invite token'
          },
          meta: {
            timestamp: new Date().toISOString(),
            vendorId: vendorId,
            action: 'reuse_existing_token'
          }
        };
      }

      // Generate new invite token
      const inviteData = await this.vendorsService.generateInviteToken(vendorId);
      
      return {
        success: true,
        data: {
          token: inviteData.token,
          expiresAt: inviteData.expiresAt,
          inviteLink: inviteData.inviteLink,
          message: 'Invite link generated successfully'
        },
        meta: {
          timestamp: new Date().toISOString(),
          vendorId: vendorId,
          action: 'generate_new_token'
        }
      };
    } catch (error) {
      this.logger.error(`Error generating invite link for vendor ${id}:`, error);
      return {
        success: false,
        error: {
          code: 'GENERATE_INVITE_LINK_FAILED',
          message: 'Failed to generate invite link',
          details: error.message
        },
        meta: {
          timestamp: new Date().toISOString(),
          vendorId: id
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