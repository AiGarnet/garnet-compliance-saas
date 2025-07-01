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
  ParseIntPipe, 
  ParseUUIDPipe,
  Logger
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationsService, CreateOrganizationDto, UpdateOrganizationDto } from './organizations.service';

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

@Controller('api/organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  private readonly logger = new Logger(OrganizationsController.name);

  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  async createOrganization(@Body() createDto: CreateOrganizationDto): Promise<ApiResponse<any>> {
    try {
      const organization = await this.organizationsService.createOrganization(createDto);
      
      return {
        success: true,
        data: organization,
        meta: {
          timestamp: new Date().toISOString(),
          operation: 'create'
        }
      };
    } catch (error) {
      this.logger.error('Error creating organization:', error);
      return {
        success: false,
        error: {
          code: 'CREATE_ORGANIZATION_FAILED',
          message: 'Failed to create organization',
          details: error.message
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  @Get()
  async getAllOrganizations(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('includeUsers') includeUsers: string = 'false'
  ): Promise<ApiResponse<any>> {
    try {
      const result = await this.organizationsService.getAllOrganizations(
        page, 
        limit, 
        includeUsers === 'true'
      );
      
      return {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: Math.ceil(result.total / result.limit)
          }
        }
      };
    } catch (error) {
      this.logger.error('Error getting organizations:', error);
      return {
        success: false,
        error: {
          code: 'FETCH_ORGANIZATIONS_FAILED',
          message: 'Failed to retrieve organizations',
          details: error.message
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  @Get(':id')
  async getOrganization(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeUsers') includeUsers: string = 'false'
  ): Promise<ApiResponse<any>> {
    try {
      const organization = await this.organizationsService.getOrganizationById(
        id, 
        includeUsers === 'true'
      );
      
      return {
        success: true,
        data: organization,
        meta: {
          timestamp: new Date().toISOString(),
          organizationId: id
        }
      };
    } catch (error) {
      this.logger.error(`Error getting organization ${id}:`, error);
      return {
        success: false,
        error: {
          code: 'FETCH_ORGANIZATION_FAILED',
          message: 'Failed to retrieve organization',
          details: error.message
        },
        meta: {
          timestamp: new Date().toISOString(),
          organizationId: id
        }
      };
    }
  }

  @Put(':id')
  async updateOrganization(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateOrganizationDto
  ): Promise<ApiResponse<any>> {
    try {
      const organization = await this.organizationsService.updateOrganization(id, updateDto);
      
      return {
        success: true,
        data: organization,
        meta: {
          timestamp: new Date().toISOString(),
          organizationId: id,
          operation: 'update'
        }
      };
    } catch (error) {
      this.logger.error(`Error updating organization ${id}:`, error);
      return {
        success: false,
        error: {
          code: 'UPDATE_ORGANIZATION_FAILED',
          message: 'Failed to update organization',
          details: error.message
        },
        meta: {
          timestamp: new Date().toISOString(),
          organizationId: id
        }
      };
    }
  }

  @Delete(':id')
  async deleteOrganization(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse<any>> {
    try {
      await this.organizationsService.deleteOrganization(id);
      
      return {
        success: true,
        data: { message: 'Organization deleted successfully' },
        meta: {
          timestamp: new Date().toISOString(),
          organizationId: id,
          operation: 'delete'
        }
      };
    } catch (error) {
      this.logger.error(`Error deleting organization ${id}:`, error);
      return {
        success: false,
        error: {
          code: 'DELETE_ORGANIZATION_FAILED',
          message: 'Failed to delete organization',
          details: error.message
        },
        meta: {
          timestamp: new Date().toISOString(),
          organizationId: id
        }
      };
    }
  }

  @Get(':id/members')
  async getOrganizationMembers(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse<any>> {
    try {
      const members = await this.organizationsService.getOrganizationMembers(id);
      
      return {
        success: true,
        data: members,
        meta: {
          timestamp: new Date().toISOString(),
          organizationId: id,
          memberCount: members.length
        }
      };
    } catch (error) {
      this.logger.error(`Error getting organization members for ${id}:`, error);
      return {
        success: false,
        error: {
          code: 'FETCH_MEMBERS_FAILED',
          message: 'Failed to retrieve organization members',
          details: error.message
        },
        meta: {
          timestamp: new Date().toISOString(),
          organizationId: id
        }
      };
    }
  }

  @Post(':id/members/:userId')
  async addMemberToOrganization(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string
  ): Promise<ApiResponse<any>> {
    try {
      await this.organizationsService.addUserToOrganization(id, userId);
      
      return {
        success: true,
        data: { message: 'User added to organization successfully' },
        meta: {
          timestamp: new Date().toISOString(),
          organizationId: id,
          userId,
          operation: 'addMember'
        }
      };
    } catch (error) {
      this.logger.error(`Error adding user ${userId} to organization ${id}:`, error);
      return {
        success: false,
        error: {
          code: 'ADD_MEMBER_FAILED',
          message: 'Failed to add user to organization',
          details: error.message
        },
        meta: {
          timestamp: new Date().toISOString(),
          organizationId: id,
          userId
        }
      };
    }
  }

  @Delete(':id/members/:userId')
  async removeMemberFromOrganization(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string
  ): Promise<ApiResponse<any>> {
    try {
      await this.organizationsService.removeUserFromOrganization(id, userId);
      
      return {
        success: true,
        data: { message: 'User removed from organization successfully' },
        meta: {
          timestamp: new Date().toISOString(),
          organizationId: id,
          userId,
          operation: 'removeMember'
        }
      };
    } catch (error) {
      this.logger.error(`Error removing user ${userId} from organization ${id}:`, error);
      return {
        success: false,
        error: {
          code: 'REMOVE_MEMBER_FAILED',
          message: 'Failed to remove user from organization',
          details: error.message
        },
        meta: {
          timestamp: new Date().toISOString(),
          organizationId: id,
          userId
        }
      };
    }
  }

  @Get(':id/stats')
  async getOrganizationStats(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse<any>> {
    try {
      const stats = await this.organizationsService.getOrganizationStats(id);
      
      return {
        success: true,
        data: stats,
        meta: {
          timestamp: new Date().toISOString(),
          organizationId: id
        }
      };
    } catch (error) {
      this.logger.error(`Error getting organization stats for ${id}:`, error);
      return {
        success: false,
        error: {
          code: 'FETCH_STATS_FAILED',
          message: 'Failed to retrieve organization statistics',
          details: error.message
        },
        meta: {
          timestamp: new Date().toISOString(),
          organizationId: id
        }
      };
    }
  }
} 