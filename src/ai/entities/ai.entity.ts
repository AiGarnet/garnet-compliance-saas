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
 * Interface for AI answer generation request
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
 * Interface for batch answer generation
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
  answers: AiAnswerResponse[];
  metadata: {
    totalQuestions: number;
    successfulAnswers: number;
    failedAnswers: number;
    processingTimeMs: number;
    timestamp: string;
  };
}

/**
 * Interface for compliance data used in AI context
 */
export interface ComplianceData {
  name: string;
  category: string;
  description: string;
  jurisdiction?: string;
  domains?: string[];
  relevanceScore?: number;
} 