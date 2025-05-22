import { z } from 'zod';

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
  questionId: string;
  question: string;
  answer: 'Yes' | 'No' | 'Partially' | string;
}

/**
 * Represents a vendor in the system
 */
export interface Vendor {
  id: string; /* UUID */
  name: string;
  status: VendorStatus;
  questionnaireAnswers: QuestionnaireAnswer[];
  riskScore: number;
  riskLevel: RiskLevel;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Zod schema for runtime validation of QuestionnaireAnswer
 */
export const QuestionnaireAnswerSchema = z.object({
  questionId: z.string(),
  question: z.string(),
  answer: z.string()
});

/**
 * Zod schema for runtime validation of Vendor
 */
export const VendorSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.nativeEnum(VendorStatus),
  questionnaireAnswers: z.array(QuestionnaireAnswerSchema),
  riskScore: z.number(),
  riskLevel: z.nativeEnum(RiskLevel),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

/**
 * Zod schema for an array of vendors
 */
export const VendorsSchema = z.array(VendorSchema); 