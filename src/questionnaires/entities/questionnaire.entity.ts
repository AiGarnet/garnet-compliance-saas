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
  status: QuestionnaireStatus;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  questions?: QuestionnaireQuestion[];
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