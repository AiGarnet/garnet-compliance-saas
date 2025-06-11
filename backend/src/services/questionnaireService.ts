import { QuestionnaireRepository } from '../db/questionnaireRepository';
import { Questionnaire, QuestionnaireQuestion } from '../types/questionnaire';

const questionnaireRepository = new QuestionnaireRepository();

export class QuestionnaireService {

  /**
   * Create a new questionnaire
   */
  async createQuestionnaire(title: string, questions: string[]): Promise<Questionnaire> {
    return questionnaireRepository.createQuestionnaire(title, questions);
  }

  /**
   * Get all questionnaires
   */
  async getAllQuestionnaires(): Promise<Questionnaire[]> {
    return questionnaireRepository.getAllQuestionnaires();
  }

  /**
   * Get a specific questionnaire by ID
   */
  async getQuestionnaireById(id: string): Promise<Questionnaire | null> {
    return questionnaireRepository.getQuestionnaireById(id);
  }

  /**
   * Get questions for a specific questionnaire
   */
  async getQuestionnaireQuestions(questionnaireId: string): Promise<QuestionnaireQuestion[]> {
    return questionnaireRepository.getQuestionnaireQuestions(questionnaireId);
  }

  /**
   * Update a questionnaire
   */
  async updateQuestionnaire(
    id: string, 
    updates: { title?: string; status?: string }
  ): Promise<Questionnaire | null> {
    return questionnaireRepository.updateQuestionnaire(id, updates);
  }

  /**
   * Update a question in a questionnaire
   */
  async updateQuestion(
    questionnaireId: string, 
    questionId: string, 
    updates: { question?: string; answer?: string }
  ): Promise<QuestionnaireQuestion | null> {
    return questionnaireRepository.updateQuestion(questionnaireId, questionId, updates);
  }

  /**
   * Delete a questionnaire
   */
  async deleteQuestionnaire(id: string): Promise<boolean> {
    return questionnaireRepository.deleteQuestionnaire(id);
  }
} 