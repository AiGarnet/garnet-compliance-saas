import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ActivitiesService } from '../../activities/activities.service';
import { ActivityStatus } from '../../activities/entities/activity.entity';
import { LOG_ACTIVITY_KEY, LogActivityConfig } from '../decorators/log-activity.decorator';

@Injectable()
export class ActivityLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ActivityLoggingInterceptor.name);

  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const activityConfig = this.reflector.get<LogActivityConfig>(
      LOG_ACTIVITY_KEY,
      context.getHandler(),
    );

    if (!activityConfig) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (response) => {
        try {
          await this.logActivity(activityConfig, request, response, startTime, true);
        } catch (error) {
          this.logger.error(`Failed to log successful activity: ${error.message}`);
        }
      }),
      catchError(async (error) => {
        if (!activityConfig.skipOnError) {
          try {
            await this.logActivity(activityConfig, request, null, startTime, false, error);
          } catch (logError) {
            this.logger.error(`Failed to log error activity: ${logError.message}`);
          }
        }
        throw error; // Re-throw the original error
      }),
    );
  }

  private async logActivity(
    config: LogActivityConfig,
    request: any,
    response: any,
    startTime: number,
    success: boolean,
    error?: any,
  ): Promise<void> {
    try {
      const user = request.user || {};
      const responseTime = Date.now() - startTime;

      // Determine activity status
      let status = ActivityStatus.SUCCESS;
      if (!success) {
        status = ActivityStatus.FAILED;
      } else if (response?.success === false) {
        status = ActivityStatus.FAILED;
      } else if (response?.meta?.status === 'pending') {
        status = ActivityStatus.PENDING;
      } else if (response?.meta?.status === 'in_progress') {
        status = ActivityStatus.IN_PROGRESS;
      }

      // Extract entity information
      const entityId = config.getEntityId ? config.getEntityId(response, request) : undefined;
      const entityName = config.getEntityName ? config.getEntityName(response, request) : undefined;

      // Generate description
      let description: string;
      if (config.getDescription) {
        description = config.getDescription(response, request);
      } else {
        // Generate default description based on success/failure
        const action = config.type.replace(/_/g, ' ').toLowerCase();
        const entity = entityName || config.entityType || 'item';
        const userName = user.name || user.email || 'User';
        
        if (success && (!response || response.success !== false)) {
          description = `${userName} successfully ${action} "${entity}"`;
        } else {
          const errorMsg = error?.message || response?.error?.message || 'unknown error';
          description = `${userName} failed to ${action} "${entity}": ${errorMsg}`;
        }
      }

      // Generate toast configuration
      let toastConfig;
      if (config.getToastConfig) {
        try {
          toastConfig = config.getToastConfig(response, request);
          
          // Adjust toast type based on actual status
          if (status === ActivityStatus.FAILED) {
            toastConfig = {
              ...toastConfig,
              type: 'error',
              title: toastConfig.title.replace('Successful', 'Failed'),
              message: `Failed to ${config.type.replace(/_/g, ' ').toLowerCase()}: ${
                error?.message || response?.error?.message || 'Unknown error'
              }`
            };
          } else if (status === ActivityStatus.PENDING || status === ActivityStatus.IN_PROGRESS) {
            toastConfig = {
              ...toastConfig,
              type: 'warning',
              showProgress: true
            };
          }
        } catch (toastError) {
          this.logger.warn(`Failed to generate toast config: ${toastError.message}`);
          toastConfig = {
            title: success ? 'Success' : 'Error',
            message: description,
            type: success ? 'success' : 'error',
            duration: 4000
          };
        }
      }

      // Generate metadata
      let metadata: Record<string, any> = {};
      if (config.getMetadata) {
        try {
          metadata = config.getMetadata(response, request);
        } catch (metaError) {
          this.logger.warn(`Failed to generate metadata: ${metaError.message}`);
        }
      }

      // Add request context to metadata
      metadata = {
        ...metadata,
        apiEndpoint: request.url,
        httpMethod: request.method,
        responseTime,
        ipAddress: request.ip || request.connection?.remoteAddress,
        userAgent: request.headers?.['user-agent'],
        timestamp: new Date().toISOString(),
        ...(error && {
          errorCode: error.code || error.status,
          errorMessage: error.message,
          errorStack: error.stack
        }),
        ...(response?.meta && {
          apiMeta: response.meta
        })
      };

      // Log the activity
      await this.activitiesService.logActivity({
        type: config.type,
        status,
        description,
        userId: user.id,
        userName: user.name || user.email,
        userEmail: user.email,
        entityId,
        entityType: config.entityType,
        entityName,
        metadata,
        toastConfig,
        request: {
          endpoint: request.url,
          method: request.method,
          responseTime,
          ipAddress: request.ip || request.connection?.remoteAddress,
          userAgent: request.headers?.['user-agent']
        }
      });

      this.logger.log(
        `Activity logged: ${config.type} by ${user.name || user.email || user.id} - ${status} (${responseTime}ms)`
      );

    } catch (error) {
      this.logger.error(`Failed to log activity: ${error.message}`, error.stack);
      // Don't throw here to avoid breaking the main request
    }
  }
} 