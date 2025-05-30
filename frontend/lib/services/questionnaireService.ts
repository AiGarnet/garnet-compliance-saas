import { Question } from '../types/questionnaire.types';
import { VendorService } from './vendorService';

// Base API URL - adjust based on environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Questionnaire Service
 * Handles interactions with the question answering API
 */
export const QuestionnaireService = {
  /**
   * Generate answers for a list of questions
   * @param questions - Array of question strings
   * @returns Promise with the questions and their answers
   */
  async generateAnswers(questions: string[]): Promise<{
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
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questions }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate answers');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error generating answers:', error);
      return {
        success: false,
        error: error.message || 'An unknown error occurred',
      };
    }
  },

  /**
   * Generate an answer for a single question
   * @param question - The question string
   * @returns Promise with the question and its answer
   */
  async generateAnswer(question: string): Promise<{
    success: boolean;
    data?: {
      question: string;
      answer: string;
    };
    error?: string;
  }> {
    try {
      const result = await this.generateAnswers([question]);
      
      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || 'Failed to generate answer',
        };
      }

      const answer = result.data.answers[0];
      
      if (answer.error) {
        return {
          success: false,
          error: answer.error,
        };
      }

      return {
        success: true,
        data: {
          question: answer.question,
          answer: answer.answer,
        },
      };
    } catch (error: any) {
      console.error('Error generating answer:', error);
      return {
        success: false,
        error: error.message || 'An unknown error occurred',
      };
    }
  },

  /**
   * Save questionnaire results to a vendor
   * @param vendorId - ID of the vendor, or null if creating a new vendor
   * @param vendorName - Name of the vendor (required if vendorId is null)
   * @param answers - Array of question/answer pairs
   * @returns Object indicating success and the updated/created vendor
   */
  saveQuestionnaireToVendor(
    vendorId: string | null,
    vendorName: string | null,
    answers: Array<{ question: string; answer: string }>
  ): { success: boolean; vendorId?: string; error?: string } {
    try {
      if (vendorId) {
        // Update existing vendor
        const updatedVendor = VendorService.saveVendorQuestionnaire(vendorId, answers);
        
        if (!updatedVendor) {
          return { 
            success: false, 
            error: `Vendor with ID ${vendorId} not found` 
          };
        }
        
        return { 
          success: true, 
          vendorId: updatedVendor.id 
        };
      } else {
        // Create new vendor
        if (!vendorName) {
          return { 
            success: false, 
            error: 'Vendor name is required when creating a new vendor' 
          };
        }
        
        const newVendor = VendorService.createVendorWithQuestionnaire(vendorName, answers);
        
        return { 
          success: true, 
          vendorId: newVendor.id 
        };
      }
    } catch (error: any) {
      console.error('Error saving questionnaire to vendor:', error);
      return {
        success: false,
        error: error.message || 'An unknown error occurred',
      };
    }
  },
}; 