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