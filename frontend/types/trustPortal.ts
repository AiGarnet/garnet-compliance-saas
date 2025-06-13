export interface TrustPortalItem {
  id: number;
  vendorId: number;
  title: string;
  description?: string;
  category: TrustPortalCategory;
  fileUrl?: string;
  fileType?: string;
  fileSize?: string;
  content?: string;
  isQuestionnaireAnswer: boolean;
  questionnaireId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TrustPortalCategory = 
  | 'Certification'
  | 'Statement'
  | 'Policy'
  | 'Evidence'
  | 'Questionnaire'; 