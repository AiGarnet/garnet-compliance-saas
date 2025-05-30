/**
 * Represents a single question in a questionnaire
 */
export interface Question {
  id: string;
  text: string;
  category?: string;
  subcategory?: string;
  isRequired?: boolean;
  responseType?: QuestionResponseType;
}

/**
 * Possible response types for questions
 */
export enum QuestionResponseType {
  TEXT = 'text',
  BOOLEAN = 'boolean',
  MULTIPLE_CHOICE = 'multiple_choice',
  SINGLE_CHOICE = 'single_choice',
  DATE = 'date',
  FILE_UPLOAD = 'file_upload',
}

/**
 * Represents a question with its answer
 */
export interface QuestionWithAnswer extends Question {
  answer: string;
  answeredAt?: string;
}

/**
 * API response format for generating answers
 */
export interface GenerateAnswersResponse {
  success: boolean;
  data?: {
    answers: Array<{
      question: string;
      answer: string;
      error?: string | null;
    }>;
    metadata: {
      totalQuestions: number;
      processingTimeMs: number;
      timestamp: string;
    };
  };
  error?: string;
}

/**
 * API response format for generating a single answer
 */
export interface GenerateAnswerResponse {
  success: boolean;
  data?: {
    question: string;
    answer: string;
  };
  error?: string;
} 