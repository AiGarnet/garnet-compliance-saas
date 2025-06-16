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
 * Work status for vendor projects
 */
export enum WorkStatus {
  COMPLETED = 'Completed',
  IN_PROGRESS = 'In Progress',
  PLANNED = 'Planned'
}

/**
 * Represents a vendor's work/project submission
 */
export interface VendorWork {
  id: string;
  vendorId: number;
  projectName: string;
  description?: string;
  status: WorkStatus;
  startDate?: Date;
  endDate?: Date;
  clientName?: string;
  technologies?: string[];
  category?: string;
  shareToTrustPortal: boolean;
  evidenceFiles?: string[]; // Array of evidence file IDs
  questionnaireAnswers?: string[]; // Array of questionnaire answer IDs
  createdAt: Date;
  updatedAt: Date;
  isDraft: boolean;
  lastSavedAt?: Date;
}

/**
 * Represents an answer to a specific questionnaire question
 */
export interface QuestionnaireAnswer {
  id: string;
  vendorId: number;
  questionId: string;
  question: string;
  answer: string;
  shareToTrustPortal: boolean; // New field for trust portal sharing
  workId?: string; // Link to associated work submission
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a vendor in the system with updated field alignment
 */
export interface Vendor {
  vendorId: number;
  uuid?: string;
  companyName: string;
  region: string;
  status: VendorStatus;
  riskScore: number;
  riskLevel: RiskLevel;
  createdAt: Date;
  updatedAt: Date;
  questionnaireAnswers?: QuestionnaireAnswer[];
  contactName?: string;
  contactEmail: string;
  website?: string;
  industry?: string;
  description?: string;
  hasSuggestions?: boolean; // Flag to indicate if vendor has AI-generated suggestions
  
  // Legacy compatibility fields
  id?: string;
  name?: string;
}

/**
 * Interface for creating a new vendor (excludes auto-generated fields)
 */
export interface CreateVendorRequest {
  companyName: string;
  region: string;
  contactEmail: string;
  status?: VendorStatus;
  riskScore?: number;
  riskLevel?: RiskLevel;
  contactName?: string;
  website?: string;
  industry?: string;
  description?: string;
}

/**
 * Interface for updating a vendor (all fields optional except vendorId)
 */
export interface UpdateVendorRequest {
  vendorId: number;
  companyName?: string;
  region?: string;
  contactEmail?: string;
  status?: VendorStatus;
  riskScore?: number;
  riskLevel?: RiskLevel;
  contactName?: string;
  website?: string;
  industry?: string;
  description?: string;
} 