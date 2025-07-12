import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, ActivityType, ActivityStatus } from './entities/activity.entity';

export interface LogActivityOptions {
  type: ActivityType;
  userId?: string;
  userName?: string;
  userEmail?: string;
  entityId?: string;
  entityType?: string;
  entityName?: string;
  description?: string;
  status?: ActivityStatus;
  metadata?: Record<string, any>;
  toastConfig?: {
    title: string;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
    duration?: number;
    showProgress?: boolean;
    actions?: Array<{ label: string; action: string; }>;
  };
  request?: {
    endpoint?: string;
    method?: string;
    responseTime?: number;
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface ActivityFilters {
  userId?: string;
  type?: ActivityType | ActivityType[];
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ActivitySummary {
  totalActivities: number;
  todayActivities: number;
  weekActivities: number;
  monthActivities: number;
  activitiesByType: Record<ActivityType, number>;
  activitiesByStatus: Record<ActivityStatus, number>;
  mostActiveUsers: Array<{
    userId: string;
    userName: string;
    activityCount: number;
  }>;
  recentActivities: Activity[];
}

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
  ) {}

  /**
   * Log a new activity to the database
   */
  async logActivity(options: LogActivityOptions): Promise<Activity> {
    try {
      const description = options.description || this.generateDescription(options);
      
      const activity = this.activityRepository.create({
        type: options.type,
        description,
        userId: options.userId,
        entityId: options.entityId ? parseInt(options.entityId) : null,
        entityType: options.entityType,
        metadata: {
          ...options.metadata,
          status: options.status || ActivityStatus.SUCCESS,
          userName: options.userName,
          userEmail: options.userEmail,
          entityName: options.entityName,
          toastConfig: options.toastConfig,
          ...(options.request && {
            apiEndpoint: options.request.endpoint,
            httpMethod: options.request.method,
            responseTime: options.request.responseTime,
            ipAddress: options.request.ipAddress,
            userAgent: options.request.userAgent,
          })
        },
      });

      const savedActivity = await this.activityRepository.save(activity);
      
      this.logger.log(`Activity logged: ${options.type} by ${options.userName || options.userId}`);
      
      return savedActivity;
    } catch (error) {
      this.logger.error(`Failed to log activity: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate a human-readable description for the activity
   */
  private generateDescription(options: LogActivityOptions): string {
    const user = options.userName || options.userEmail || 'User';
    const entity = options.entityName || 'item';

    switch (options.type) {
      case ActivityType.CLIENT_CREATED:
        return `${user} created client "${entity}"`;
      case ActivityType.CLIENT_UPDATED:
        return `${user} updated client "${entity}"`;
      case ActivityType.CLIENT_DELETED:
        return `${user} deleted client "${entity}"`;
      case ActivityType.CLIENT_STATUS_CHANGED:
        const oldStatus = options.metadata?.previousStatus || 'unknown';
        const newStatus = options.metadata?.newStatus || 'unknown';
        return `${user} changed client "${entity}" status from ${oldStatus} to ${newStatus}`;
      
      case ActivityType.QUESTIONNAIRE_CREATED:
        return `${user} created questionnaire "${entity}"`;
      case ActivityType.QUESTIONNAIRE_UPDATED:
        return `${user} updated questionnaire "${entity}"`;
      case ActivityType.QUESTIONNAIRE_SUBMITTED:
        return `${user} submitted questionnaire "${entity}"`;
      case ActivityType.QUESTIONNAIRE_APPROVED:
        return `${user} approved questionnaire "${entity}"`;
      case ActivityType.QUESTIONNAIRE_REJECTED:
        return `${user} rejected questionnaire "${entity}"`;
      case ActivityType.QUESTIONNAIRE_DELETED:
        return `${user} deleted questionnaire "${entity}"`;
      
      case ActivityType.EVIDENCE_UPLOADED:
        const fileName = options.metadata?.fileName || 'document';
        return `${user} uploaded evidence "${fileName}" for ${entity}`;
      case ActivityType.EVIDENCE_APPROVED:
        return `${user} approved evidence for ${entity}`;
      case ActivityType.EVIDENCE_REJECTED:
        return `${user} rejected evidence for ${entity}`;
      
      case ActivityType.USER_LOGIN:
        return `${user} logged in`;
      case ActivityType.USER_LOGOUT:
        return `${user} logged out`;
      case ActivityType.USER_CREATED:
        return `${user} created new user account`;
      
      case ActivityType.TRUST_PORTAL_VIEWED:
        return `${user} viewed trust portal`;
      case ActivityType.TRUST_PORTAL_SHARED:
        return `${user} shared trust portal`;
      
      case ActivityType.REPORT_GENERATED:
        const reportType = options.metadata?.reportType || 'compliance report';
        return `${user} generated ${reportType}`;
      
      case ActivityType.WAITLIST_SIGNUP:
        return `${user} signed up for waitlist`;
      
      default:
        return `${user} performed ${options.type.replace(/_/g, ' ')}`;
    }
  }

  /**
   * Get activities with optional filtering
   */
  async getActivities(filters: ActivityFilters = {}): Promise<Activity[]> {
    try {
      const query = this.activityRepository.createQueryBuilder('activity');

      if (filters.userId) {
        query.andWhere('activity.user_id = :userId', { userId: filters.userId });
      }

      if (filters.type) {
        if (Array.isArray(filters.type)) {
          query.andWhere('activity.activity_type IN (:...types)', { types: filters.type });
        } else {
          query.andWhere('activity.activity_type = :type', { type: filters.type });
        }
      }

      if (filters.entityType) {
        query.andWhere('activity.entity_type = :entityType', { entityType: filters.entityType });
      }

      if (filters.entityId) {
        query.andWhere('activity.entity_id = :entityId', { entityId: filters.entityId });
      }

      if (filters.startDate) {
        query.andWhere('activity.created_at >= :startDate', { startDate: filters.startDate });
      }

      if (filters.endDate) {
        query.andWhere('activity.created_at <= :endDate', { endDate: filters.endDate });
      }

      query.orderBy('activity.created_at', 'DESC');

      if (filters.limit) {
        query.limit(filters.limit);
      }

      if (filters.offset) {
        query.offset(filters.offset);
      }

      return await query.getMany();
    } catch (error) {
      this.logger.error(`Failed to get activities: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get recent activities for dashboard
   */
  async getRecentActivities(limit: number = 10, userId?: string): Promise<Activity[]> {
    return this.getActivities({
      limit,
      userId,
    });
  }

  /**
   * Get activity summary/statistics
   */
  async getActivitySummary(userId?: string): Promise<ActivitySummary> {
    try {
      const baseQuery = this.activityRepository.createQueryBuilder('activity');
      
      if (userId) {
        baseQuery.andWhere('activity.user_id = :userId', { userId });
      }

      // Total activities
      const totalActivities = await baseQuery.getCount();

      // Today's activities
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayQuery = baseQuery.clone();
      todayQuery.andWhere('activity.created_at >= :today', { today })
               .andWhere('activity.created_at < :tomorrow', { tomorrow });
      const todayActivities = await todayQuery.getCount();

      // This week's activities
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekQuery = baseQuery.clone();
      weekQuery.andWhere('activity.created_at >= :weekStart', { weekStart });
      const weekActivities = await weekQuery.getCount();

      // This month's activities
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthQuery = baseQuery.clone();
      monthQuery.andWhere('activity.created_at >= :monthStart', { monthStart });
      const monthActivities = await monthQuery.getCount();

      // Activities by type
      const typeQuery = baseQuery.clone();
      typeQuery.select('activity.activity_type', 'type')
               .addSelect('COUNT(*)', 'count')
               .groupBy('activity.activity_type');
      const typeResults = await typeQuery.getRawMany();
      const activitiesByType = typeResults.reduce((acc, row) => {
        acc[row.type] = parseInt(row.count);
        return acc;
      }, {} as Record<ActivityType, number>);

      // Activities by status (default to success since not in database)
      const activitiesByStatus = {
        [ActivityStatus.SUCCESS]: totalActivities,
        [ActivityStatus.PENDING]: 0,
        [ActivityStatus.FAILED]: 0,
        [ActivityStatus.IN_PROGRESS]: 0,
      } as Record<ActivityStatus, number>;

      // Most active users (if not filtered by user)
      let mostActiveUsers = [];
      if (!userId) {
        const userQuery = baseQuery.clone();
        userQuery.select('activity.user_id', 'userId')
                 .addSelect('COUNT(*)', 'count')
                 .where('activity.user_id IS NOT NULL')
                 .groupBy('activity.user_id')
                 .orderBy('COUNT(*)', 'DESC')
                 .limit(5);
        const userResults = await userQuery.getRawMany();
        mostActiveUsers = userResults.map(row => ({
          userId: row.userId,
          userName: row.userId, // Use userId as userName since userName is in metadata
          activityCount: parseInt(row.count)
        }));
      }

      // Recent activities
      const recentActivities = await this.getRecentActivities(10, userId);

      return {
        totalActivities,
        todayActivities,
        weekActivities,
        monthActivities,
        activitiesByType,
        activitiesByStatus,
        mostActiveUsers,
        recentActivities
      };
    } catch (error) {
      this.logger.error(`Failed to get activity summary: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update activity metadata (useful for async operations)
   */
  async updateActivityMetadata(
    activityId: number, 
    additionalMetadata?: Record<string, any>
  ): Promise<Activity> {
    try {
      const activity = await this.activityRepository.findOne({ 
        where: { id: activityId } 
      });

      if (!activity) {
        throw new Error(`Activity with ID ${activityId} not found`);
      }
      
      if (additionalMetadata) {
        activity.metadata = {
          ...activity.metadata,
          ...additionalMetadata
        };
      }

      return await this.activityRepository.save(activity);
    } catch (error) {
      this.logger.error(`Failed to update activity status: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete old activities (cleanup job)
   */
  async cleanupOldActivities(olderThanDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await this.activityRepository
        .createQueryBuilder()
        .delete()
        .from(Activity)
        .where('createdAt < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.log(`Cleaned up ${result.affected} old activities`);
      return result.affected || 0;
    } catch (error) {
      this.logger.error(`Failed to cleanup old activities: ${error.message}`, error.stack);
      throw error;
    }
  }
} 