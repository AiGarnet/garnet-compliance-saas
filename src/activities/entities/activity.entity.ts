import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ActivityType {
  // Client/Vendor Management
  CLIENT_CREATED = 'client_created',
  CLIENT_UPDATED = 'client_updated',
  CLIENT_DELETED = 'client_deleted',
  CLIENT_STATUS_CHANGED = 'client_status_changed',
  
  // Questionnaire Activities
  QUESTIONNAIRE_CREATED = 'questionnaire_created',
  QUESTIONNAIRE_UPDATED = 'questionnaire_updated',
  QUESTIONNAIRE_SUBMITTED = 'questionnaire_submitted',
  QUESTIONNAIRE_REVIEWED = 'questionnaire_reviewed',
  QUESTIONNAIRE_APPROVED = 'questionnaire_approved',
  QUESTIONNAIRE_REJECTED = 'questionnaire_rejected',
  QUESTIONNAIRE_DELETED = 'questionnaire_deleted',
  
  // Evidence & Documents
  EVIDENCE_UPLOADED = 'evidence_uploaded',
  EVIDENCE_APPROVED = 'evidence_approved',
  EVIDENCE_REJECTED = 'evidence_rejected',
  EVIDENCE_DELETED = 'evidence_deleted',
  DOCUMENT_UPLOADED = 'document_uploaded',
  
  // Compliance & Assessment
  COMPLIANCE_ASSESSMENT_STARTED = 'compliance_assessment_started',
  COMPLIANCE_ASSESSMENT_COMPLETED = 'compliance_assessment_completed',
  COMPLIANCE_SCORE_UPDATED = 'compliance_score_updated',
  FRAMEWORK_ADDED = 'framework_added',
  FRAMEWORK_REMOVED = 'framework_removed',
  
  // User Activities
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_PROFILE_UPDATED = 'user_profile_updated',
  USER_CREATED = 'user_created',
  USER_DELETED = 'user_deleted',
  
  // Trust Portal
  TRUST_PORTAL_VIEWED = 'trust_portal_viewed',
  TRUST_PORTAL_SHARED = 'trust_portal_shared',
  TRUST_PORTAL_UPDATED = 'trust_portal_updated',
  
  // System Activities
  REPORT_GENERATED = 'report_generated',
  DATA_EXPORTED = 'data_exported',
  DATA_IMPORTED = 'data_imported',
  INTEGRATION_CONNECTED = 'integration_connected',
  INTEGRATION_DISCONNECTED = 'integration_disconnected',
  
  // Waitlist Activities
  WAITLIST_SIGNUP = 'waitlist_signup',
  WAITLIST_APPROVED = 'waitlist_approved',
  WAITLIST_REJECTED = 'waitlist_rejected'
}

export enum ActivityStatus {
  SUCCESS = 'success',
  PENDING = 'pending',
  FAILED = 'failed',
  IN_PROGRESS = 'in_progress'
}

@Entity('activities')
@Index(['userId', 'createdAt'])
@Index(['type', 'createdAt'])
@Index(['status', 'createdAt'])
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  @Index()
  type: ActivityType;

  @Column({
    type: 'enum',
    enum: ActivityStatus,
    default: ActivityStatus.SUCCESS
  })
  status: ActivityStatus;

  @Column({ length: 500 })
  description: string;

  @Column({ name: 'user_id', length: 255, nullable: true })
  userId: string;

  @Column({ name: 'user_name', length: 255, nullable: true })
  userName: string;

  @Column({ name: 'user_email', length: 255, nullable: true })
  userEmail: string;

  // Entity references for relationships
  @Column({ name: 'entity_id', length: 255, nullable: true })
  entityId: string; // ID of the related entity (vendor, questionnaire, etc.)

  @Column({ name: 'entity_type', length: 100, nullable: true })
  entityType: string; // Type of entity (vendor, questionnaire, evidence, etc.)

  @Column({ name: 'entity_name', length: 255, nullable: true })
  entityName: string; // Name/title of the entity for display

  // Metadata stored as JSON
  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: {
    // Client related
    clientId?: string;
    clientName?: string;
    previousStatus?: string;
    newStatus?: string;
    
    // Questionnaire related
    questionnaireId?: string;
    questionnaireName?: string;
    frameworkType?: string;
    
    // Evidence related
    evidenceId?: string;
    evidenceType?: string;
    fileName?: string;
    fileSize?: number;
    
    // Compliance related
    complianceScore?: number;
    previousScore?: number;
    frameworkName?: string;
    
    // API Response data
    apiEndpoint?: string;
    httpMethod?: string;
    responseTime?: number;
    
    // Request context
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    
    // Additional context
    additionalData?: Record<string, any>;
  };

  // Toast notification data
  @Column({ name: 'toast_config', type: 'jsonb', nullable: true })
  toastConfig: {
    title: string;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
    duration?: number;
    showProgress?: boolean;
    actions?: Array<{
      label: string;
      action: string;
    }>;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Virtual properties for display
  get formattedTimestamp(): string {
    const now = new Date();
    const diff = now.getTime() - this.createdAt.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    
    return this.createdAt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: this.createdAt.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  get iconName(): string {
    const iconMap = {
      [ActivityType.CLIENT_CREATED]: 'UserPlus',
      [ActivityType.CLIENT_UPDATED]: 'Edit',
      [ActivityType.CLIENT_DELETED]: 'Trash2',
      [ActivityType.CLIENT_STATUS_CHANGED]: 'RefreshCw',
      [ActivityType.QUESTIONNAIRE_CREATED]: 'FileText',
      [ActivityType.QUESTIONNAIRE_SUBMITTED]: 'Send',
      [ActivityType.QUESTIONNAIRE_APPROVED]: 'CheckCircle',
      [ActivityType.QUESTIONNAIRE_REJECTED]: 'XCircle',
      [ActivityType.EVIDENCE_UPLOADED]: 'Upload',
      [ActivityType.COMPLIANCE_ASSESSMENT_COMPLETED]: 'CheckCircle',
      [ActivityType.USER_LOGIN]: 'LogIn',
      [ActivityType.USER_LOGOUT]: 'LogOut',
      [ActivityType.TRUST_PORTAL_VIEWED]: 'Eye',
      [ActivityType.REPORT_GENERATED]: 'FileBarChart'
    };
    return iconMap[this.type] || 'Activity';
  }

  get colorScheme(): { bg: string; text: string; } {
    if (this.status === ActivityStatus.FAILED) {
      return { bg: 'bg-red-100', text: 'text-red-600' };
    }
    if (this.status === ActivityStatus.PENDING || this.status === ActivityStatus.IN_PROGRESS) {
      return { bg: 'bg-yellow-100', text: 'text-yellow-600' };
    }

    const colorMap = {
      [ActivityType.CLIENT_CREATED]: { bg: 'bg-green-100', text: 'text-green-600' },
      [ActivityType.CLIENT_UPDATED]: { bg: 'bg-blue-100', text: 'text-blue-600' },
      [ActivityType.CLIENT_DELETED]: { bg: 'bg-red-100', text: 'text-red-600' },
      [ActivityType.QUESTIONNAIRE_CREATED]: { bg: 'bg-purple-100', text: 'text-purple-600' },
      [ActivityType.QUESTIONNAIRE_APPROVED]: { bg: 'bg-green-100', text: 'text-green-600' },
      [ActivityType.QUESTIONNAIRE_REJECTED]: { bg: 'bg-red-100', text: 'text-red-600' },
      [ActivityType.EVIDENCE_UPLOADED]: { bg: 'bg-blue-100', text: 'text-blue-600' },
      [ActivityType.USER_LOGIN]: { bg: 'bg-green-100', text: 'text-green-600' },
    };
    return colorMap[this.type] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  }
} 