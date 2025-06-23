/**
 * Represents a trust portal item
 */
export interface TrustPortalItem {
  id: number;
  vendorId: number;
  title: string;
  description?: string;
  category: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: string;
  content?: string;
  isQuestionnaireAnswer: boolean;
  questionnaireId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Trust portal categories
 */
export type TrustPortalCategory = 
  | 'Certification'
  | 'Statement'
  | 'Policy'
  | 'Evidence'
  | 'Questionnaire';

/**
 * Vendor with trust portal items
 */
export interface VendorWithTrustPortal {
  vendorId: number;
  companyName: string;
}

/**
 * Trust portal feedback from enterprises
 */
export interface TrustPortalFeedback {
  id: number;
  vendorId: number;
  enterpriseContactName?: string;
  enterpriseContactEmail: string;
  enterpriseCompanyName?: string;
  feedbackType: FeedbackType;
  subject: string;
  message: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  inviteToken?: string;
  createdAt: Date;
  updatedAt: Date;
  responses?: TrustPortalFeedbackResponse[];
}

/**
 * Feedback types
 */
export enum FeedbackType {
  GENERAL = 'general',
  DOCUMENT_REQUEST = 'document_request',
  CLARIFICATION = 'clarification',
  COMPLIANCE_ISSUE = 'compliance_issue',
  FOLLOW_UP = 'follow_up'
}

/**
 * Feedback status
 */
export enum FeedbackStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

/**
 * Feedback priority
 */
export enum FeedbackPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Responses to trust portal feedback
 */
export interface TrustPortalFeedbackResponse {
  id: number;
  feedbackId: number;
  responderType: ResponderType;
  responderName?: string;
  responderEmail?: string;
  message: string;
  attachments?: string[];
  isInternalNote: boolean;
  createdAt: Date;
}

/**
 * Responder types
 */
export enum ResponderType {
  VENDOR = 'vendor',
  ENTERPRISE = 'enterprise',
  ADMIN = 'admin'
}

/**
 * Documents shared via trust portal
 */
export interface TrustPortalSharedDocument {
  id: number;
  vendorId: number;
  documentTitle: string;
  documentDescription?: string;
  documentCategory: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  isEvidenceFile: boolean;
  isQuestionnaireAnswer: boolean;
  questionnaireId?: string;
  workId?: string;
  shareToTrustPortal: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Complete trust portal data for a vendor
 */
export interface VendorTrustPortalData {
  vendor: {
    vendorId: number;
    companyName: string;
    region?: string;
    industry?: string;
    description?: string;
    website?: string;
    contactEmail?: string;
    contactName?: string;
    status?: string;
  };
  sharedDocuments: TrustPortalSharedDocument[];
  vendorWorks: any[];
  questionnaireAnswers: any[];
  evidenceFiles: any[];
  feedback: TrustPortalFeedback[];
  inviteToken?: string;
} 