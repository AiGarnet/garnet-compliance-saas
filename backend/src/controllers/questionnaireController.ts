import { Request, Response } from 'express';
import { QuestionnaireService } from '../services/questionnaireService';

const questionnaireService = new QuestionnaireService();

export class QuestionnaireController {

  /**
   * Create a new questionnaire
   */
  async createQuestionnaire(req: Request, res: Response) {
    try {
      const { title, questions } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }
      
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'Questions array is required and cannot be empty' });
      }
      
      const questionnaire = await questionnaireService.createQuestionnaire(title, questions);
      
      res.status(201).json({ questionnaire });
    } catch (error: any) {
      console.error('Error creating questionnaire:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * Get all questionnaires
   */
  async getAllQuestionnaires(req: Request, res: Response) {
    try {
      const questionnaires = await questionnaireService.getAllQuestionnaires();
      res.json({ questionnaires });
    } catch (error: any) {
      console.error('Error fetching questionnaires:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * Get a specific questionnaire by ID
   */
  async getQuestionnaireById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const questionnaire = await questionnaireService.getQuestionnaireById(id);
      
      if (!questionnaire) {
        return res.status(404).json({ error: 'Questionnaire not found' });
      }
      
      res.json({ questionnaire });
    } catch (error: any) {
      console.error(`Error fetching questionnaire with ID ${req.params.id}:`, error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * Get questions for a specific questionnaire
   */
  async getQuestionnaireQuestions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const questions = await questionnaireService.getQuestionnaireQuestions(id);
      
      res.json({ questions });
    } catch (error: any) {
      console.error(`Error fetching questions for questionnaire ${req.params.id}:`, error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * Update a specific questionnaire
   */
  async updateQuestionnaire(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, status } = req.body;
      
      const questionnaire = await questionnaireService.updateQuestionnaire(id, { title, status });
      
      if (!questionnaire) {
        return res.status(404).json({ error: 'Questionnaire not found' });
      }
      
      res.json({ questionnaire });
    } catch (error: any) {
      console.error(`Error updating questionnaire with ID ${req.params.id}:`, error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * Update a specific question in a questionnaire
   */
  async updateQuestion(req: Request, res: Response) {
    try {
      const { id, questionId } = req.params;
      const { question, answer } = req.body;
      
      const updatedQuestion = await questionnaireService.updateQuestion(id, questionId, { question, answer });
      
      if (!updatedQuestion) {
        return res.status(404).json({ error: 'Question or questionnaire not found' });
      }
      
      res.json({ question: updatedQuestion });
    } catch (error: any) {
      console.error(`Error updating question ${req.params.questionId} in questionnaire ${req.params.id}:`, error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * Delete a questionnaire
   */
  async deleteQuestionnaire(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const deleted = await questionnaireService.deleteQuestionnaire(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Questionnaire not found' });
      }
      
      res.json({ message: 'Questionnaire deleted successfully' });
    } catch (error: any) {
      console.error(`Error deleting questionnaire with ID ${req.params.id}:`, error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
} 