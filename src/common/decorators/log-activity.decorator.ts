import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ActivityType, ActivityStatus } from '../../activities/entities/activity.entity';

export const LOG_ACTIVITY_KEY = 'logActivity';

export interface LogActivityConfig {
  type: ActivityType;
  entityType?: string;
  getEntityId?: (result: any, req: any) => string;
  getEntityName?: (result: any, req: any) => string;
  getDescription?: (result: any, req: any) => string;
  getToastConfig?: (result: any, req: any) => {
    title: string;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
    duration?: number;
    showProgress?: boolean;
    actions?: Array<{ label: string; action: string; }>;
  };
  getMetadata?: (result: any, req: any) => Record<string, any>;
  skipOnError?: boolean; // Don't log if API call fails
}

/**
 * Decorator to automatically log activities based on API responses
 * @param config Configuration for activity logging
 */
export const LogActivity = (config: LogActivityConfig) => {
  return SetMetadata(LOG_ACTIVITY_KEY, config);
};

/**
 * Parameter decorator to extract user info from request
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * Parameter decorator to extract request metadata
 */
export const RequestMeta = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return {
      ipAddress: request.ip || request.connection.remoteAddress,
      userAgent: request.headers['user-agent'],
      endpoint: request.url,
      method: request.method,
    };
  },
);

// Common activity configurations for reuse
export const CommonActivityConfigs = {
  CLIENT_CREATED: {
    type: ActivityType.CLIENT_CREATED,
    entityType: 'client',
    getEntityId: (result: any) => result.data?.vendorId || result.data?.id,
    getEntityName: (result: any) => result.data?.companyName || result.data?.name,
    getToastConfig: (result: any) => ({
      title: 'Client Created',
      message: `Client "${result.data?.companyName || result.data?.name}" has been created successfully`,
      type: 'success' as const,
      duration: 5000,
      actions: [
        { label: 'View', action: `view_client_${result.data?.vendorId || result.data?.id}` }
      ]
    }),
    getMetadata: (result: any) => ({
      clientName: result.data?.companyName || result.data?.name,
      clientId: result.data?.vendorId || result.data?.id,
      status: result.data?.status
    })
  },

  CLIENT_UPDATED: {
    type: ActivityType.CLIENT_UPDATED,
    entityType: 'client',
    getEntityId: (result: any, req: any) => req.params?.id || result.data?.vendorId || result.data?.id,
    getEntityName: (result: any) => result.data?.companyName || result.data?.name,
    getToastConfig: (result: any) => ({
      title: 'Client Updated',
      message: `Client "${result.data?.companyName || result.data?.name}" has been updated successfully`,
      type: 'success' as const,
      duration: 4000,
      actions: [
        { label: 'View', action: `view_client_${result.data?.vendorId || result.data?.id}` }
      ]
    }),
    getMetadata: (result: any, req: any) => ({
      clientName: result.data?.companyName || result.data?.name,
      clientId: result.data?.vendorId || result.data?.id,
      updatedFields: Object.keys(req.body || {}),
      previousStatus: req.body?.previousStatus,
      newStatus: result.data?.status
    })
  },

  CLIENT_DELETED: {
    type: ActivityType.CLIENT_DELETED,
    entityType: 'client',
    getEntityId: (result: any, req: any) => req.params?.id,
    getEntityName: (result: any, req: any) => result.meta?.entityName || 'Unknown Client',
    getToastConfig: (result: any, req: any) => ({
      title: 'Client Deleted',
      message: `Client "${result.meta?.entityName || 'Client'}" has been deleted successfully`,
      type: 'success' as const,
      duration: 4000
    }),
    getMetadata: (result: any, req: any) => ({
      clientName: result.meta?.entityName || 'Unknown',
      clientId: req.params?.id
    })
  },

  QUESTIONNAIRE_CREATED: {
    type: ActivityType.QUESTIONNAIRE_CREATED,
    entityType: 'questionnaire',
    getEntityId: (result: any) => result.data?.id,
    getEntityName: (result: any) => result.data?.title || result.data?.name,
    getToastConfig: (result: any) => ({
      title: 'Questionnaire Created',
      message: `Questionnaire "${result.data?.title}" has been created`,
      type: 'success' as const,
      duration: 5000,
      actions: [
        { label: 'View', action: `view_questionnaire_${result.data?.id}` },
        { label: 'Edit', action: `edit_questionnaire_${result.data?.id}` }
      ]
    }),
    getMetadata: (result: any) => ({
      questionnaireName: result.data?.title,
      questionnaireId: result.data?.id,
      frameworkType: result.data?.framework
    })
  },

  QUESTIONNAIRE_SUBMITTED: {
    type: ActivityType.QUESTIONNAIRE_SUBMITTED,
    entityType: 'questionnaire',
    getEntityId: (result: any, req: any) => req.params?.id,
    getEntityName: (result: any) => result.data?.title,
    getToastConfig: (result: any) => ({
      title: 'Questionnaire Submitted',
      message: `Questionnaire has been submitted for review`,
      type: 'info' as const,
      duration: 5000,
      showProgress: true
    }),
    getMetadata: (result: any, req: any) => ({
      questionnaireName: result.data?.title,
      questionnaireId: req.params?.id,
      submissionTime: new Date().toISOString()
    })
  },

  EVIDENCE_UPLOADED: {
    type: ActivityType.EVIDENCE_UPLOADED,
    entityType: 'evidence',
    getEntityId: (result: any) => result.data?.id,
    getEntityName: (result: any) => result.data?.fileName,
    getToastConfig: (result: any) => ({
      title: 'Evidence Uploaded',
      message: `Evidence "${result.data?.fileName}" uploaded successfully`,
      type: 'success' as const,
      duration: 4000,
      actions: [
        { label: 'View', action: `view_evidence_${result.data?.id}` }
      ]
    }),
    getMetadata: (result: any) => ({
      fileName: result.data?.fileName,
      evidenceId: result.data?.id,
      fileSize: result.data?.fileSize,
      evidenceType: result.data?.type,
      frameworkType: result.data?.framework
    })
  },

  USER_LOGIN: {
    type: ActivityType.USER_LOGIN,
    entityType: 'user',
    getEntityId: (result: any, req: any) => req.user?.id,
    getEntityName: (result: any, req: any) => req.user?.email,
    getToastConfig: () => ({
      title: 'Welcome Back!',
      message: 'You have successfully logged in',
      type: 'success' as const,
      duration: 3000
    }),
    skipOnError: true
  },

  WAITLIST_SIGNUP: {
    type: ActivityType.WAITLIST_SIGNUP,
    entityType: 'waitlist',
    getEntityId: (result: any) => result.data?.id,
    getEntityName: (result: any) => result.data?.email,
    getToastConfig: (result: any) => ({
      title: 'Waitlist Signup',
      message: `Thank you for joining our waitlist!`,
      type: 'success' as const,
      duration: 5000,
      actions: [
        { label: 'Learn More', action: 'learn_more' }
      ]
    }),
    getMetadata: (result: any) => ({
      email: result.data?.email,
      company: result.data?.company,
      industry: result.data?.industry
    })
  }
};

/**
 * Quick decorators for common activities
 */
export const LogClientCreated = () => LogActivity(CommonActivityConfigs.CLIENT_CREATED);
export const LogClientUpdated = () => LogActivity(CommonActivityConfigs.CLIENT_UPDATED);
export const LogClientDeleted = () => LogActivity(CommonActivityConfigs.CLIENT_DELETED);
export const LogQuestionnaireCreated = () => LogActivity(CommonActivityConfigs.QUESTIONNAIRE_CREATED);
export const LogQuestionnaireSubmitted = () => LogActivity(CommonActivityConfigs.QUESTIONNAIRE_SUBMITTED);
export const LogEvidenceUploaded = () => LogActivity(CommonActivityConfigs.EVIDENCE_UPLOADED);
export const LogUserLogin = () => LogActivity(CommonActivityConfigs.USER_LOGIN);
export const LogWaitlistSignup = () => LogActivity(CommonActivityConfigs.WAITLIST_SIGNUP); 