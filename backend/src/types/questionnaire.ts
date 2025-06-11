/**
 * Represents a questionnaire
 */
export interface Questionnaire {
  id: string;
  title: string;
  status: string;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  questions: QuestionnaireQuestion[];
}

/**
 * Represents a question within a questionnaire
 */
export interface QuestionnaireQuestion {
  id: string;
  questionnaireId: string;
  questionText: string;
  answer?: string;
  questionOrder: number;
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Status enum for questionnaires
 */
export enum QuestionnaireStatus {
  NOT_STARTED = 'Not Started',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  REVIEWED = 'Reviewed'
} 