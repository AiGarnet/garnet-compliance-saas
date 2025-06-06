/**
 * Vendor status representing stages in the vendor approval process
 */
export enum VendorStatus {
  QUESTIONNAIRE_PENDING = 'Questionnaire Pending',
  IN_REVIEW = 'In Review',
  PENDING_REVIEW = 'Pending Review',
  APPROVED = 'Approved'
}

/**
 * Risk level classification for vendors
 */
export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

/**
 * Represents an answer to a specific questionnaire question
 */
export interface QuestionnaireAnswer {
  id: string;
  vendorId: string;
  questionId: string;
  question: string;
  answer: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a vendor in the system with additional fields for database storage
 */
export interface Vendor {
  id: string;
  name: string;
  status: VendorStatus;
  riskScore: number;
  riskLevel: RiskLevel;
  createdAt: Date;
  updatedAt: Date;
  questionnaireAnswers: QuestionnaireAnswer[];
  contactName?: string;
  contactEmail?: string;
  website?: string;
  industry?: string;
  description?: string;
}

/**
 * Form data for creating/updating a vendor
 */
export interface VendorFormData {
  name: string;
  contactName?: string;
  contactEmail?: string;
  website?: string;
  industry?: string;
  description?: string;
  status?: VendorStatus;
  riskScore?: number;
  riskLevel?: RiskLevel;
} 