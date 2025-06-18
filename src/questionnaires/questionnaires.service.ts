import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AiService } from '../ai/ai.service';
import { CreateQuestionnaireDto, UpdateQuestionnaireDto, UpdateQuestionDto } from './dto/questionnaire.dto';
import { Questionnaire, QuestionnaireQuestion, QuestionnaireStatus } from './entities/questionnaire.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QuestionnairesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly aiService?: AiService,
  ) {}

  /**
   * Create a new questionnaire by saving questions as vendor answers
   * Supports automatic AI answer generation for better UX
   */
  async createQuestionnaire(createQuestionnaireDto: CreateQuestionnaireDto): Promise<Questionnaire> {
    const { title, questions, vendorId, generateAnswers } = createQuestionnaireDto;

    // Generate a unique questionnaire ID for grouping
    const questionnaireId = Date.now();

    const createdQuestions: any[] = [];
    
    // First, store the questionnaire title as metadata in a special record
    const titleRecordId = uuidv4();
    const titleQuery = `
      INSERT INTO vendor_questionnaire_answers (
        id, vendor_id, questionnaire_id, question_id, question, answer, status, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW()
      )
    `;
    
    await this.databaseService.query(titleQuery, [
      vendorId || null,
      questionnaireId,
      titleRecordId,
      '__QUESTIONNAIRE_TITLE__', // Special marker for title record
      title, // Store the title in the answer field
      'Metadata'
    ]);

    if (questions && questions.length > 0) {
      for (const question of questions) {
        const questionId = uuidv4();
        
        // Default status - if answers will be generated, mark as 'Pending', otherwise 'Not Started'
        const initialStatus = generateAnswers ? 'Pending' : 'Not Started';
        
        // Save each question as a vendor questionnaire answer entry
        const query = `
          INSERT INTO vendor_questionnaire_answers (
            id, vendor_id, questionnaire_id, question_id, question, answer, status, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW()
          ) RETURNING 
            id,
            vendor_id as "vendorId",
            questionnaire_id as "questionnaireId",
            question_id as "questionId",
            question,
            answer,
            status,
            created_at as "createdAt",
            updated_at as "updatedAt"
        `;

        const values = [
          vendorId || null,
          questionnaireId,
          questionId,
          question.questionText,
          '', // Empty answer initially - will be filled by AI if generateAnswers is true
          initialStatus
        ];

        const result = await this.databaseService.query(query, values);
        createdQuestions.push(result.rows[0]);
      }
    }

    // If generateAnswers is true, generate AI answers for all questions
    if (generateAnswers && questions && questions.length > 0 && this.aiService) {
      try {
        console.log(`🤖 Generating AI answers for ${questions.length} questions...`);
        
        // Extract question texts for AI generation
        const questionTexts = questions.map(q => q.questionText);
        
        // Generate AI answers using batch processing
        const aiResponse = await this.aiService.generateBatchAnswers({
          questions: questionTexts,
          vendorId: vendorId,
          context: `Questionnaire: ${title}`
        });

        if (aiResponse.answers && aiResponse.answers.length > 0) {
          // Update database with generated answers
          for (let i = 0; i < aiResponse.answers.length; i++) {
            const aiAnswer = aiResponse.answers[i];
            const createdQuestion = createdQuestions[i];
            
            if (aiAnswer.success && aiAnswer.answer && createdQuestion) {
              const updateQuery = `
                UPDATE vendor_questionnaire_answers 
                SET answer = $1, status = $2, updated_at = NOW()
                WHERE questionnaire_id = $3 AND question_id = $4
              `;
              
              await this.databaseService.query(updateQuery, [
                aiAnswer.answer,
                'Completed',
                questionnaireId,
                createdQuestion.questionId
              ]);

              // Update the returned question object
              createdQuestion.answer = aiAnswer.answer;
              createdQuestion.status = 'Completed';
            }
          }
          
          console.log(`✅ Generated ${aiResponse.metadata?.successfulAnswers || 0} AI answers successfully`);
        }
      } catch (error) {
        console.error('❌ Error generating AI answers:', error);
        // Continue without AI answers - don't fail the questionnaire creation
      }
    }

    // Determine final status based on actual completion
    const completedCount = createdQuestions.filter(q => q.status === 'Completed').length;
    const finalStatus = completedCount === createdQuestions.length && createdQuestions.length > 0 ? 
      QuestionnaireStatus.COMPLETED : 
      (completedCount > 0 ? QuestionnaireStatus.IN_PROGRESS : QuestionnaireStatus.NOT_STARTED);

    const finalProgress = createdQuestions.length > 0 ? 
      Math.round((completedCount / createdQuestions.length) * 100) : 0;

    return {
      id: questionnaireId.toString(),
      title: title,
      status: finalStatus,
      vendorId: vendorId,
      progress: finalProgress,
      createdAt: new Date(),
      updatedAt: new Date(),
      questions: createdQuestions
    };
  }

  /**
   * Get all questionnaires (grouped by questionnaire_id)
   */
  async getAllQuestionnaires(): Promise<Questionnaire[]> {
    const query = `
      SELECT 
        vqa.questionnaire_id as id,
        COALESCE(
          (SELECT answer FROM vendor_questionnaire_answers vqa_title 
           WHERE vqa_title.questionnaire_id = vqa.questionnaire_id 
           AND vqa_title.question = '__QUESTIONNAIRE_TITLE__' LIMIT 1),
          'Questionnaire ' || vqa.questionnaire_id
        ) as title,
        CASE 
          WHEN COUNT(CASE WHEN vqa.status = 'Completed' AND vqa.question != '__QUESTIONNAIRE_TITLE__' THEN 1 END) = COUNT(CASE WHEN vqa.question != '__QUESTIONNAIRE_TITLE__' THEN 1 END) THEN 'Completed'
          WHEN COUNT(CASE WHEN vqa.status != 'Not Started' AND vqa.question != '__QUESTIONNAIRE_TITLE__' THEN 1 END) > 0 THEN 'In Progress'
          ELSE 'Not Started'
        END as status,
        vqa.vendor_id as "vendorId",
        v.company_name as "vendorName",
        MIN(vqa.created_at) as "createdAt",
        MAX(vqa.updated_at) as "updatedAt",
        COUNT(CASE WHEN vqa.question != '__QUESTIONNAIRE_TITLE__' THEN 1 END) as "questionCount",
        COUNT(CASE WHEN vqa.answer != '' AND vqa.question != '__QUESTIONNAIRE_TITLE__' THEN 1 END) as "answerCount"
      FROM vendor_questionnaire_answers vqa 
      LEFT JOIN vendors v ON vqa.vendor_id = v.vendor_id
      WHERE vqa.questionnaire_id IS NOT NULL
      GROUP BY vqa.questionnaire_id, vqa.vendor_id, v.company_name
      ORDER BY MIN(vqa.created_at) DESC
    `;

    const result = await this.databaseService.query(query);
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      status: row.status as QuestionnaireStatus,
      vendorId: row.vendorId,
      vendorName: row.vendorName,
      progress: row.answerCount > 0 ? Math.round((row.answerCount / row.questionCount) * 100) : 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
  }

  /**
   * Get questionnaires for a specific vendor
   */
  async getQuestionnairesByVendor(vendorId: string): Promise<Questionnaire[]> {
    const query = `
      SELECT 
        vqa.questionnaire_id as id,
        COALESCE(
          (SELECT answer FROM vendor_questionnaire_answers vqa_title 
           WHERE vqa_title.questionnaire_id = vqa.questionnaire_id 
           AND vqa_title.question = '__QUESTIONNAIRE_TITLE__' LIMIT 1),
          'Questionnaire ' || vqa.questionnaire_id
        ) as title,
        CASE 
          WHEN COUNT(CASE WHEN vqa.status = 'Completed' AND vqa.question != '__QUESTIONNAIRE_TITLE__' THEN 1 END) = COUNT(CASE WHEN vqa.question != '__QUESTIONNAIRE_TITLE__' THEN 1 END) THEN 'Completed'
          WHEN COUNT(CASE WHEN vqa.status != 'Not Started' AND vqa.question != '__QUESTIONNAIRE_TITLE__' THEN 1 END) > 0 THEN 'In Progress'
          ELSE 'Not Started'
        END as status,
        vqa.vendor_id as "vendorId",
        v.company_name as "vendorName",
        MIN(vqa.created_at) as "createdAt",
        MAX(vqa.updated_at) as "updatedAt",
        COUNT(CASE WHEN vqa.question != '__QUESTIONNAIRE_TITLE__' THEN 1 END) as "questionCount",
        COUNT(CASE WHEN vqa.answer != '' AND vqa.question != '__QUESTIONNAIRE_TITLE__' THEN 1 END) as "answerCount"
      FROM vendor_questionnaire_answers vqa 
      LEFT JOIN vendors v ON vqa.vendor_id = v.vendor_id
      WHERE vqa.vendor_id = $1 AND vqa.questionnaire_id IS NOT NULL
      GROUP BY vqa.questionnaire_id, vqa.vendor_id, v.company_name
      ORDER BY MIN(vqa.created_at) DESC
    `;

    const result = await this.databaseService.query(query, [parseInt(vendorId)]);
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      status: row.status as QuestionnaireStatus,
      vendorId: row.vendorId,
      vendorName: row.vendorName,
      progress: row.answerCount > 0 ? Math.round((row.answerCount / row.questionCount) * 100) : 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
  }

  /**
   * Get a questionnaire by ID with questions and answers
   */
  async getQuestionnaireById(id: string): Promise<Questionnaire | null> {
    // First get the title
    const titleQuery = `
      SELECT answer as title 
      FROM vendor_questionnaire_answers 
      WHERE questionnaire_id = $1 AND question = '__QUESTIONNAIRE_TITLE__' 
      LIMIT 1
    `;
    const titleResult = await this.databaseService.query(titleQuery, [parseInt(id)]);
    const questionnaireTitle = titleResult.rows[0]?.title || `Questionnaire ${id}`;

    const query = `
      SELECT 
        vqa.id,
        vqa.questionnaire_id as "questionnaireId",
        vqa.vendor_id as "vendorId",
        v.company_name as "vendorName",
        vqa.question_id as "questionId",
        vqa.question,
        vqa.answer,
        vqa.status,
        vqa.share_to_trust_portal as "shareToTrustPortal",
        vqa.created_at as "createdAt",
        vqa.updated_at as "updatedAt"
      FROM vendor_questionnaire_answers vqa
      LEFT JOIN vendors v ON vqa.vendor_id = v.vendor_id
      WHERE vqa.questionnaire_id = $1 AND vqa.question != '__QUESTIONNAIRE_TITLE__'
      ORDER BY vqa.created_at ASC
    `;

    const result = await this.databaseService.query(query, [parseInt(id)]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const firstRow = result.rows[0];
    const questions = result.rows.map(row => ({
      id: row.questionId,
      questionnaireId: row.questionnaireId,
      questionText: row.question,
      answer: row.answer,
      questionOrder: 1, // Not tracked anymore, but kept for compatibility
      isRequired: true,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));

    const answers = result.rows.map(row => ({
      id: row.id,
      questionnaireId: row.questionnaireId,
      vendorId: row.vendorId,
      questionId: row.questionId,
      question: row.question,
      answer: row.answer,
      status: row.status,
      shareToTrustPortal: row.shareToTrustPortal,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));

    // Calculate status and progress
    const completedAnswers = answers.filter(a => a.status === 'Completed').length;
    const totalQuestions = answers.length;
    const progress = totalQuestions > 0 ? Math.round((completedAnswers / totalQuestions) * 100) : 0;
    
    let status: QuestionnaireStatus = QuestionnaireStatus.NOT_STARTED;
    if (completedAnswers === totalQuestions) {
      status = QuestionnaireStatus.COMPLETED;
    } else if (completedAnswers > 0) {
      status = QuestionnaireStatus.IN_PROGRESS;
    }

    return {
      id: id,
      title: questionnaireTitle,
      status: status,
      vendorId: firstRow.vendorId,
      vendorName: firstRow.vendorName,
      progress: progress,
      createdAt: firstRow.createdAt,
      updatedAt: firstRow.updatedAt,
      questions: questions,
      answers: answers
    };
  }

  /**
   * Get questions for a specific questionnaire (same as answers now)
   */
  async getQuestionnaireQuestions(questionnaireId: string): Promise<QuestionnaireQuestion[]> {
    const query = `
      SELECT 
        question_id as id,
        questionnaire_id as "questionnaireId",
        question as "questionText",
        answer,
        1 as "questionOrder",
        true as "isRequired",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM vendor_questionnaire_answers 
      WHERE questionnaire_id = $1 AND question != '__QUESTIONNAIRE_TITLE__'
      ORDER BY created_at ASC
    `;

    const result = await this.databaseService.query(query, [questionnaireId]);
    return result.rows;
  }

  /**
   * Update a questionnaire (update all related entries)
   */
  async updateQuestionnaire(id: string, updateQuestionnaireDto: UpdateQuestionnaireDto): Promise<Questionnaire | null> {
    // For simplicity, just return the existing questionnaire
    // Individual question updates should use updateQuestion method
    return this.getQuestionnaireById(id);
  }

  /**
   * Update a specific question/answer
   */
  async updateQuestion(questionnaireId: string, questionId: string, updateQuestionDto: UpdateQuestionDto): Promise<QuestionnaireQuestion | null> {
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updateQuestionDto).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'questionText') {
          updateFields.push(`question = $${paramIndex}`);
        } else if (key === 'answer') {
          updateFields.push(`answer = $${paramIndex}`);
        } else {
          // Handle other fields if needed
          updateFields.push(`${this.camelToSnake(key)} = $${paramIndex}`);
        }
        values.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      // Return existing question if no updates
      const existingQuestionQuery = `
        SELECT 
          question_id as id,
          questionnaire_id as "questionnaireId",
          question as "questionText",
          answer,
          1 as "questionOrder",
          true as "isRequired",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM vendor_questionnaire_answers 
        WHERE question_id = $1 AND questionnaire_id = $2
      `;
      
      const result = await this.databaseService.query(existingQuestionQuery, [questionId, questionnaireId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(questionId, questionnaireId);

    const query = `
      UPDATE vendor_questionnaire_answers 
      SET ${updateFields.join(', ')}
      WHERE question_id = $${paramIndex} AND questionnaire_id = $${paramIndex + 1}
      RETURNING 
        question_id as id,
        questionnaire_id as "questionnaireId",
        question as "questionText",
        answer,
        1 as "questionOrder",
        true as "isRequired",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await this.databaseService.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Delete a questionnaire (delete all related entries from vendor_questionnaire_answers table)
   */
  async deleteQuestionnaire(id: string): Promise<boolean> {
    try {
      console.log(`🗑️ Attempting to delete questionnaire ${id} from vendor_questionnaire_answers table`);
      
      // First, check if the questionnaire exists
      const checkQuery = `
        SELECT COUNT(*) as count 
        FROM vendor_questionnaire_answers 
        WHERE questionnaire_id = $1
      `;
      const checkResult = await this.databaseService.query(checkQuery, [parseInt(id)]);
      const recordCount = parseInt(checkResult.rows[0].count);
      
      console.log(`📊 Found ${recordCount} records for questionnaire ${id}`);
      
      if (recordCount === 0) {
        console.log(`⚠️ No records found for questionnaire ${id}`);
        return false;
      }
      
      // Delete all records for this questionnaire
      const deleteQuery = 'DELETE FROM vendor_questionnaire_answers WHERE questionnaire_id = $1';
      const deleteResult = await this.databaseService.query(deleteQuery, [parseInt(id)]);
      
      const deletedCount = deleteResult.rowCount || 0;
      console.log(`✅ Successfully deleted ${deletedCount} records for questionnaire ${id}`);
      
      return deletedCount > 0;
    } catch (error) {
      console.error(`❌ Error deleting questionnaire ${id}:`, error);
      throw new Error(`Failed to delete questionnaire: ${error.message}`);
    }
  }

  /**
   * Save vendor answers for a questionnaire
   */
  async saveVendorAnswersForQuestionnaire(
    questionnaireId: string, 
    vendorId: string, 
    answers: Array<{ questionId?: string; question: string; answer: string }>
  ): Promise<any[]> {
    const savedAnswers: any[] = [];

    for (const answer of answers) {
      const query = `
        INSERT INTO vendor_questionnaire_answers (
          id, vendor_id, questionnaire_id, question_id, question, answer, status, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW()
        ) ON CONFLICT (vendor_id, question_id) 
        DO UPDATE SET 
          questionnaire_id = EXCLUDED.questionnaire_id,
          question = EXCLUDED.question,
          answer = EXCLUDED.answer,
          status = EXCLUDED.status,
          updated_at = NOW()
        RETURNING 
          id,
          vendor_id as "vendorId",
          questionnaire_id as "questionnaireId",
          question_id as "questionId",
          question,
          answer,
          status,
          share_to_trust_portal as "shareToTrustPortal",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;
      
      const questionId = answer.questionId || `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const values = [
        parseInt(vendorId), 
        parseInt(questionnaireId), 
        questionId, 
        answer.question, 
        answer.answer,
        'Pending' // Default status
      ];
      
      const result = await this.databaseService.query(query, values);
      savedAnswers.push(result.rows[0]);
    }

    return savedAnswers;
  }

  /**
   * Get questionnaires with vendor answers for a specific vendor
   */
  async getQuestionnairesWithAnswersForVendor(vendorId: string): Promise<any[]> {
    const query = `
      SELECT DISTINCT
        vqa.questionnaire_id as id,
        'Questionnaire ' || vqa.questionnaire_id as title,
        CASE 
          WHEN COUNT(CASE WHEN vqa.status = 'Completed' THEN 1 END) = COUNT(*) THEN 'Completed'
          WHEN COUNT(CASE WHEN vqa.status != 'Not Started' THEN 1 END) > 0 THEN 'In Progress'
          ELSE 'Not Started'
        END as "questionnaireStatus",
        vqa.vendor_id as "vendorId",
        v.company_name as "vendorName",
        MIN(vqa.created_at) as "createdAt",
        MAX(vqa.updated_at) as "updatedAt",
        COUNT(*) as "answerCount"
      FROM vendor_questionnaire_answers vqa 
      LEFT JOIN vendors v ON vqa.vendor_id = v.vendor_id
      WHERE vqa.vendor_id = $1 AND vqa.questionnaire_id IS NOT NULL
      GROUP BY vqa.questionnaire_id, vqa.vendor_id, v.company_name
      ORDER BY MIN(vqa.created_at) DESC
    `;

    const result = await this.databaseService.query(query, [parseInt(vendorId)]);
    return result.rows;
  }

  /**
   * Helper method to convert camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
} 