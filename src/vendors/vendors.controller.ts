import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  UseInterceptors,
  UnauthorizedException,
  ForbiddenException
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VendorStatus } from './entities/vendor.entity';
import { ActivityLoggingInterceptor } from '../common/interceptors/activity-logging.interceptor';
import {
  LogClientCreated,
  LogClientUpdated,
  LogClientDeleted,
  CurrentUser,
  RequestMeta
} from '../common/decorators/log-activity.decorator';
import { Public } from '../common/decorators/public.decorator';
import { FeatureAccessService } from '../billing/feature-access.service';

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

  constructor(
    private readonly vendorsService: VendorsService,
    private readonly featureAccessService: FeatureAccessService
  ) {}

  @Public() // Make this endpoint public
  @Get()
  async getAllVendors(
    @Query('organization_id') organizationId?: string,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any[]>> {
    try {
      // Determine organization ID from query parameter or authenticated user
      let targetOrgId = organizationId;
      
      // If no organization_id in query, try to get from authenticated user
      if (!targetOrgId && user?.organization_id) {
        targetOrgId = user.organization_id;
      }
      
      // Require organization_id for data isolation
      if (!targetOrgId) {
        return {
          success: false,
          error: {
            code: 'MISSING_ORGANIZATION_ID',
            message: 'organization_id parameter is required for vendor access'
          },
          meta: {
            timestamp: new Date().toISOString(),
            isPublic: true,
            authRequired: false
          }
        };
      }

      // Get vendors filtered by organization
      const vendors = await this.vendorsService.findAllByOrganization(targetOrgId);
      
      return {
        success: true,
        data: vendors,
        meta: {
          timestamp: new Date().toISOString(),
          count: vendors.length,
          organizationId: targetOrgId,
          filteredByOrganization: true,
          isPublic: true
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
          timestamp: new Date().toISOString(),
          isPublic: true
        }
      };
    }
  }

  @Public() // Make this endpoint public
  @Get(':id')
  async getVendor(
    @Param('id') id: string,
    @Query('organization_id') organizationId?: string,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    try {
      // Determine organization ID from query parameter or authenticated user
      let targetOrgId = organizationId;
      
      // If no organization_id in query, try to get from authenticated user
      if (!targetOrgId && user?.organization_id) {
        targetOrgId = user.organization_id;
      }
      
      // Require organization_id for data isolation
      if (!targetOrgId) {
        return {
          success: false,
          error: {
            code: 'MISSING_ORGANIZATION_ID',
            message: 'organization_id parameter is required for vendor access'
          },
          meta: {
            timestamp: new Date().toISOString(),
            vendorId: id,
            isPublic: true,
            authRequired: false
          }
        };
      }

      // Check if the ID is a number (vendor_id) or UUID
      const isNumericId = /^\d+$/.test(id);
      
      let vendor;
      if (isNumericId) {
        vendor = await this.vendorsService.findById(parseInt(id), targetOrgId);
      } else {
        vendor = await this.vendorsService.findByUuid(id, targetOrgId);
      }
      
      if (!vendor) {
        return {
          success: false,
          error: {
            code: 'VENDOR_NOT_FOUND',
            message: `Vendor with ID ${id} not found in the specified organization`
          },
          meta: {
            timestamp: new Date().toISOString(),
            vendorId: id,
            organizationId: targetOrgId,
            isPublic: true
          }
        };
      }
      
      return {
        success: true,
        data: vendor,
        meta: {
          timestamp: new Date().toISOString(),
          vendorId: id,
          organizationId: targetOrgId,
          filteredByOrganization: true,
          isPublic: true
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
          vendorId: id,
          isPublic: true
        }
      };
    }
  }

  @UseGuards(JwtAuthGuard) // Keep authentication for CREATE operations
  @Post()
  @LogClientCreated()
  async createVendor(
    @Body() createVendorDto: CreateVendorDto,
    @CurrentUser() user: any,
    @RequestMeta() requestMeta?: any
  ): Promise<ApiResponse<any>> {
    try {
      // Ensure user belongs to an organization
      if (!user?.organization_id) {
        throw new UnauthorizedException({
          success: false,
          error: {
            code: 'MISSING_ORGANIZATION',
            message: 'User must belong to an organization to create vendors'
          }
        });
      }

      // Check if user has access to create vendors (starter plan limit: 1 vendor)
      const userLimits = await this.featureAccessService.checkUserLimits(user.id);
      
      if (!userLimits.vendors.hasAccess) {
        throw new ForbiddenException({
          success: false,
          error: {
            code: 'VENDOR_LIMIT_REACHED',
            message: `You've reached your limit of ${userLimits.vendors.limit} vendor${userLimits.vendors.limit === 1 ? '' : 's'} on your current plan. Upgrade to add more vendors.`,
            upgradeRequired: 'growth',
            currentUsage: userLimits.vendors.current,
            limit: userLimits.vendors.limit
          }
        });
      }

      // Auto-populate organization and user context
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
      
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      
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

  @UseGuards(JwtAuthGuard) // Keep authentication for UPDATE operations
  @Put(':id')
  @LogClientUpdated()
  async updateVendor(
    @Param('id') id: string,
    @Body() updateVendorDto: UpdateVendorDto,
    @CurrentUser() user: any,
    @RequestMeta() requestMeta?: any
  ): Promise<ApiResponse<any>> {
    try {
      // Always require authentication and organization context for updates
      if (!user?.organization_id) {
        throw new UnauthorizedException({
          success: false,
          error: {
            code: 'MISSING_ORGANIZATION',
            message: 'User must belong to an organization to update vendors'
          }
        });
      }

      // Check if the ID is a number (vendor_id) or UUID
      const isNumericId = /^\d+$/.test(id);
      
      let vendor;
      let existingVendor;
      
      if (isNumericId) {
        // Only allow access to vendors from same organization
        existingVendor = await this.vendorsService.findById(parseInt(id), user.organization_id);
        if (!existingVendor) {
          return {
            success: false,
            error: {
              code: 'VENDOR_NOT_FOUND',
              message: `Vendor with ID ${id} not found in your organization`
            },
            meta: {
              timestamp: new Date().toISOString(),
              vendorId: id,
              operation: 'update',
              organizationId: user.organization_id
            }
          };
        }
        
        vendor = await this.vendorsService.update(parseInt(id), updateVendorDto);
      } else {
        // Only allow access to vendors from same organization
        existingVendor = await this.vendorsService.findByUuid(id, user.organization_id);
        if (!existingVendor) {
          return {
            success: false,
            error: {
              code: 'VENDOR_NOT_FOUND',
              message: `Vendor with ID ${id} not found in your organization`
            },
            meta: {
              timestamp: new Date().toISOString(),
              vendorId: id,
              operation: 'update',
              organizationId: user.organization_id
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
  @LogClientDeleted()
  async deleteVendor(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @RequestMeta() requestMeta?: any
  ): Promise<ApiResponse<any>> {
    try {
      // SECURITY FIX: Always require authentication and organization context
      if (!user?.organization_id) {
        throw new UnauthorizedException({
          success: false,
          error: {
            code: 'MISSING_ORGANIZATION',
            message: 'User must belong to an organization to delete vendors'
          }
        });
      }

      // Check if the ID is a number (vendor_id) or UUID
      const isNumericId = /^\d+$/.test(id);
      
      let existingVendor;
      let success;
      
      if (isNumericId) {
        // SECURITY FIX: Only allow access to vendors from same organization
        existingVendor = await this.vendorsService.findById(parseInt(id), user.organization_id);
        if (!existingVendor) {
          return {
            success: false,
            error: {
              code: 'VENDOR_NOT_FOUND',
              message: `Vendor with ID ${id} not found in your organization`
            },
            meta: {
              timestamp: new Date().toISOString(),
              operation: 'delete',
              entityType: 'client',
              entityId: id,
              organizationId: user.organization_id
            }
          };
        }
        success = await this.vendorsService.delete(parseInt(id));
      } else {
        // SECURITY FIX: Only allow access to vendors from same organization
        existingVendor = await this.vendorsService.findByUuid(id, user.organization_id);
        if (!existingVendor) {
          return {
            success: false,
            error: {
              code: 'VENDOR_NOT_FOUND',
              message: `Vendor with ID ${id} not found in your organization`
            },
            meta: {
              timestamp: new Date().toISOString(),
              operation: 'delete',
              entityType: 'client',
              entityId: id,
              organizationId: user.organization_id
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

  @Post(':id/generate-invite-token')
  @Public()
  async generateInviteToken(
    @Param('id') id: string
  ): Promise<ApiResponse<any>> {
    try {
      // Check if the ID is a number (vendor_id) or UUID
      const isNumericId = /^\d+$/.test(id);
      
      let vendorId: number;
      
      if (isNumericId) {
        const vendor = await this.vendorsService.findById(parseInt(id));
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
        vendorId = parseInt(id);
      } else {
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
            inviteToken: existingToken.token,
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
          inviteToken: inviteData.token,
          expiresAt: inviteData.expiresAt,
          inviteLink: inviteData.inviteLink,
          message: 'Invite token generated successfully'
        },
        meta: {
          timestamp: new Date().toISOString(),
          vendorId: vendorId,
          action: 'generate_new_token'
        }
      };
    } catch (error) {
      this.logger.error(`Error generating invite token for vendor ${id}:`, error);
      return {
        success: false,
        error: {
          code: 'GENERATE_INVITE_TOKEN_FAILED',
          message: 'Failed to generate invite token',
          details: error.message
        },
        meta: {
          timestamp: new Date().toISOString(),
          vendorId: id
        }
      };
    }
  }

  @Post(':id/trust-portal/invite')
  async generateInviteLink(
    @Param('id') id: string,
    @CurrentUser() user: any
  ): Promise<ApiResponse<any>> {
    try {
      // SECURITY FIX: Always require authentication and organization context
      if (!user?.organization_id) {
        throw new UnauthorizedException({
          success: false,
          error: {
            code: 'MISSING_ORGANIZATION',
            message: 'User must belong to an organization to generate invite links'
          }
        });
      }

      // Check if the ID is a number (vendor_id) or UUID
      const isNumericId = /^\d+$/.test(id);
      
      let vendorId: number;
      
      if (isNumericId) {
        // SECURITY FIX: Only allow access to vendors from same organization
        const vendor = await this.vendorsService.findById(parseInt(id), user.organization_id);
        if (!vendor) {
          return {
            success: false,
            error: {
              code: 'VENDOR_NOT_FOUND',
              message: `Vendor with ID ${id} not found in your organization`
            },
            meta: {
              timestamp: new Date().toISOString(),
              vendorId: id,
              organizationId: user.organization_id
            }
          };
        }
        vendorId = parseInt(id);
      } else {
        // SECURITY FIX: Only allow access to vendors from same organization
        const vendor = await this.vendorsService.findByUuid(id, user.organization_id);
        if (!vendor) {
          return {
            success: false,
            error: {
              code: 'VENDOR_NOT_FOUND',
              message: `Vendor with ID ${id} not found in your organization`
            },
            meta: {
              timestamp: new Date().toISOString(),
              vendorId: id,
              organizationId: user.organization_id
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

  @UseGuards(JwtAuthGuard) // SECURITY FIX: Require authentication for health check
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