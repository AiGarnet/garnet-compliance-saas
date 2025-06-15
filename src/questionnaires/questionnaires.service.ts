import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateQuestionnaireDto, UpdateQuestionnaireDto, UpdateQuestionDto } from './dto/questionnaire.dto';
import { Questionnaire, QuestionnaireQuestion, QuestionnaireStatus } from './entities/questionnaire.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QuestionnairesService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Create a new questionnaire with questions
   */
  async createQuestionnaire(createQuestionnaireDto: CreateQuestionnaireDto): Promise<Questionnaire> {
    const { title, questions } = createQuestionnaireDto;
    const questionnaireId = uuidv4();

    // Create the questionnaire
    const questionnaireQuery = `
      INSERT INTO questionnaires (
        id, title, status, progress, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, NOW(), NOW()
      ) RETURNING 
        id,
        title,
        status,
        progress,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const questionnaireValues = [
      questionnaireId,
      title,
      QuestionnaireStatus.NOT_STARTED,
      0
    ];

    const questionnaireResult = await this.databaseService.query(questionnaireQuery, questionnaireValues);
    const questionnaire = questionnaireResult.rows[0];

    // Create the questions
    const createdQuestions: QuestionnaireQuestion[] = [];
    
    for (const question of questions) {
      const questionId = uuidv4();
      const questionQuery = `
        INSERT INTO questionnaire_questions (
          id, questionnaire_id, question_text, question_order, is_required, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, NOW(), NOW()
        ) RETURNING 
          id,
          questionnaire_id as "questionnaireId",
          question_text as "questionText",
          answer,
          question_order as "questionOrder",
          is_required as "isRequired",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      const questionValues = [
        questionId,
        questionnaireId,
        question.questionText,
        question.questionOrder,
        question.isRequired || false
      ];

      const questionResult = await this.databaseService.query(questionQuery, questionValues);
      createdQuestions.push(questionResult.rows[0]);
    }

    return {
      ...questionnaire,
      questions: createdQuestions
    };
  }

  /**
   * Get all questionnaires
   */
  async getAllQuestionnaires(): Promise<Questionnaire[]> {
    const query = `
      SELECT 
        id,
        title,
        status,
        progress,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM questionnaires 
      ORDER BY created_at DESC
    `;

    const result = await this.databaseService.query(query);
    return result.rows;
  }

  /**
   * Get a questionnaire by ID with questions
   */
  async getQuestionnaireById(id: string): Promise<Questionnaire | null> {
    const questionnaireQuery = `
      SELECT 
        id,
        title,
        status,
        progress,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM questionnaires 
      WHERE id = $1
    `;

    const questionnaireResult = await this.databaseService.query(questionnaireQuery, [id]);
    
    if (questionnaireResult.rows.length === 0) {
      return null;
    }

    const questionnaire = questionnaireResult.rows[0];

    // Get questions for this questionnaire
    const questionsQuery = `
      SELECT 
        id,
        questionnaire_id as "questionnaireId",
        question_text as "questionText",
        answer,
        question_order as "questionOrder",
        is_required as "isRequired",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM questionnaire_questions 
      WHERE questionnaire_id = $1
      ORDER BY question_order ASC
    `;

    const questionsResult = await this.databaseService.query(questionsQuery, [id]);

    return {
      ...questionnaire,
      questions: questionsResult.rows
    };
  }

  /**
   * Get questions for a specific questionnaire
   */
  async getQuestionnaireQuestions(questionnaireId: string): Promise<QuestionnaireQuestion[]> {
    const query = `
      SELECT 
        id,
        questionnaire_id as "questionnaireId",
        question_text as "questionText",
        answer,
        question_order as "questionOrder",
        is_required as "isRequired",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM questionnaire_questions 
      WHERE questionnaire_id = $1
      ORDER BY question_order ASC
    `;

    const result = await this.databaseService.query(query, [questionnaireId]);
    return result.rows;
  }

  /**
   * Update a questionnaire
   */
  async updateQuestionnaire(id: string, updateQuestionnaireDto: UpdateQuestionnaireDto): Promise<Questionnaire | null> {
    const existingQuestionnaire = await this.getQuestionnaireById(id);
    if (!existingQuestionnaire) {
      return null;
    }

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updateQuestionnaireDto).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = this.camelToSnake(key);
        updateFields.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return existingQuestionnaire;
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE questionnaires 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        title,
        status,
        progress,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await this.databaseService.query(query, values);
    const questionnaire = result.rows[0];

    return {
      ...questionnaire,
      questions: existingQuestionnaire.questions
    };
  }

  /**
   * Update a specific question in a questionnaire
   */
  async updateQuestion(questionnaireId: string, questionId: string, updateQuestionDto: UpdateQuestionDto): Promise<QuestionnaireQuestion | null> {
    // First verify the questionnaire exists
    const questionnaire = await this.getQuestionnaireById(questionnaireId);
    if (!questionnaire) {
      return null;
    }

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updateQuestionDto).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = this.camelToSnake(key);
        updateFields.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      // Return existing question if no updates
      const existingQuestionQuery = `
        SELECT 
          id,
          questionnaire_id as "questionnaireId",
          question_text as "questionText",
          answer,
          question_order as "questionOrder",
          is_required as "isRequired",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM questionnaire_questions 
        WHERE id = $1 AND questionnaire_id = $2
      `;
      
      const result = await this.databaseService.query(existingQuestionQuery, [questionId, questionnaireId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(questionId, questionnaireId);

    const query = `
      UPDATE questionnaire_questions 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND questionnaire_id = $${paramIndex + 1}
      RETURNING 
        id,
        questionnaire_id as "questionnaireId",
        question_text as "questionText",
        answer,
        question_order as "questionOrder",
        is_required as "isRequired",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await this.databaseService.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Delete a questionnaire
   */
  async deleteQuestionnaire(id: string): Promise<boolean> {
    // Delete questions first (due to foreign key constraint)
    await this.databaseService.query('DELETE FROM questionnaire_questions WHERE questionnaire_id = $1', [id]);
    
    // Delete the questionnaire
    const result = await this.databaseService.query('DELETE FROM questionnaires WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  /**
   * Helper method to convert camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
} 