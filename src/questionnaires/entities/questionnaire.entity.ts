/**
 * Status enum for questionnaires
 */
export enum QuestionnaireStatus {
  NOT_STARTED = 'Not Started',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  REVIEWED = 'Reviewed'
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
 * Represents a questionnaire
 */
export interface Questionnaire {
  id: string;
  title: string;
  questionTitle?: string; // The actual questionnaire title from question_title column
  status: QuestionnaireStatus;
  vendorId?: number;
  vendorName?: string;
  progress?: number;
  createdAt: Date;
  updatedAt: Date;
  questions?: QuestionnaireQuestion[];
  answers?: any[]; // For compatibility with existing code
}

/**
 * Interface for creating a new questionnaire
 */
export interface CreateQuestionnaireRequest {
  title: string;
  questions: CreateQuestionRequest[];
}

/**
 * Interface for creating a new question
 */
export interface CreateQuestionRequest {
  questionText: string;
  questionOrder: number;
  isRequired?: boolean;
}

/**
 * Interface for updating a questionnaire
 */
export interface UpdateQuestionnaireRequest {
  title?: string;
  status?: QuestionnaireStatus;
}

/**
 * Interface for updating a question
 */
export interface UpdateQuestionRequest {
  questionText?: string;
  answer?: string;
  questionOrder?: number;
  isRequired?: boolean;
} 