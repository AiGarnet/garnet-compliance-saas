import { Controller, Get, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ActivitiesService, ActivityFilters } from './activities.service';
import { Activity, ActivityType, ActivityStatus } from './entities/activity.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

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

@Controller('api/activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  /**
   * Get recent activities for the dashboard
   */
  @Get('recent')
  @Public()
  async getRecentActivities(
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Request() req?: any,
  ): Promise<ApiResponse<Activity[]>> {
    try {
      const parsedLimit = limit ? parseInt(limit, 10) : 10;
      const targetUserId = userId || req?.user?.id;
      
      const activities = await this.activitiesService.getRecentActivities(
        parsedLimit,
        targetUserId
      );

      return {
        success: true,
        data: activities,
        meta: {
          timestamp: new Date().toISOString(),
          count: activities.length,
          limit: parsedLimit,
          userId: targetUserId
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ACTIVITIES_FAILED',
          message: 'Failed to fetch recent activities',
          details: error.message
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Get all activities with filtering
   */
  @Get()
  @Public()
  async getActivities(
    @Query('userId') userId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Request() req?: any,
  ): Promise<ApiResponse<Activity[]>> {
    try {
      const filters: ActivityFilters = {};

      if (userId) filters.userId = userId;
      if (type) {
        // Handle multiple types separated by comma
        const types = type.split(',') as ActivityType[];
        filters.type = types.length === 1 ? types[0] : types;
      }
      if (status) filters.status = status as ActivityStatus;
      if (entityType) filters.entityType = entityType;
      if (entityId) filters.entityId = entityId;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      if (limit) filters.limit = parseInt(limit, 10);
      if (offset) filters.offset = parseInt(offset, 10);

      // If no userId specified and user is authenticated, filter by user
      if (!userId && req?.user?.id) {
        filters.userId = req.user.id;
      }

      const activities = await this.activitiesService.getActivities(filters);

      return {
        success: true,
        data: activities,
        meta: {
          timestamp: new Date().toISOString(),
          count: activities.length,
          filters: {
            ...filters,
            startDate: filters.startDate?.toISOString(),
            endDate: filters.endDate?.toISOString()
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ACTIVITIES_FAILED',
          message: 'Failed to fetch activities',
          details: error.message
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Get activity summary/statistics
   */
  @Get('summary')
  @Public()
  async getActivitySummary(
    @Query('userId') userId?: string,
    @Request() req?: any,
  ): Promise<ApiResponse<any>> {
    try {
      const targetUserId = userId || req?.user?.id;
      const summary = await this.activitiesService.getActivitySummary(targetUserId);

      return {
        success: true,
        data: summary,
        meta: {
          timestamp: new Date().toISOString(),
          userId: targetUserId
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_SUMMARY_FAILED',
          message: 'Failed to fetch activity summary',
          details: error.message
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Get activity by ID
   */
  @Get(':id')
  @Public()
  async getActivity(@Param('id') id: string): Promise<ApiResponse<Activity>> {
    try {
      const activities = await this.activitiesService.getActivities({ 
        limit: 1, 
        offset: 0 
      });
      const activity = activities.find(a => a.id === id);

      if (!activity) {
        return {
          success: false,
          error: {
            code: 'ACTIVITY_NOT_FOUND',
            message: `Activity with ID ${id} not found`
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        };
      }

      return {
        success: true,
        data: activity,
        meta: {
          timestamp: new Date().toISOString(),
          activityId: id
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ACTIVITY_FAILED',
          message: 'Failed to fetch activity',
          details: error.message
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Public endpoint for frontend to get activity types (for filtering UI)
   */
  @Get('meta/types')
  @Public()
  async getActivityTypes(): Promise<ApiResponse<{ types: string[]; statuses: string[]; }>> {
    try {
      const types = Object.values(ActivityType);
      const statuses = Object.values(ActivityStatus);

      return {
        success: true,
        data: {
          types,
          statuses
        },
        meta: {
          timestamp: new Date().toISOString(),
          typeCount: types.length,
          statusCount: statuses.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_META_FAILED',
          message: 'Failed to fetch activity metadata',
          details: error.message
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };
    }
  }
} 