/**
 * Represents an AI suggestion for a vendor
 */
export interface AiSuggestion {
  id: string;
  vendorId: number;
  questionId?: string;
  suggestion: string;
  confidence: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Request interface for generating an answer
 */
export interface GenerateAnswerRequest {
  question: string;
  context?: string;
  vendorId?: number;
}

/**
 * Interface for AI answer response
 */
export interface AiAnswerResponse {
  question: string;
  answer: string;
  success: boolean;
  confidence?: number;
  sources?: string[];
  error?: string;
}

/**
 * Request interface for batch answers
 */
export interface BatchAnswerRequest {
  questions: string[];
  context?: string;
  vendorId?: number;
}

/**
 * Interface for batch answer response
 */
export interface BatchAnswerResponse {
  results: AiAnswerResponse[];
  answers?: AiAnswerResponse[]; // For backward compatibility
  totalQuestions: number;
  successfulAnswers: number;
  failedAnswers: number;
  processingTimeMs: number;
  metadata?: {
    successfulAnswers: number;
    failedAnswers: number;
    timestamp: string;
  };
}

/**
 * Interface for generated supporting document
 */
export interface GeneratedSupportingDocument {
  title: string;
  content: string;
  success: boolean;
  error?: string;
}

/**
 * Interface for compliance data
 */
export interface ComplianceData {
  id?: string;
  name: string;
  description: string;
  jurisdiction: string;
  category?: string;
  domains?: string[];
  content?: string;
  relevanceScore?: number;
} 