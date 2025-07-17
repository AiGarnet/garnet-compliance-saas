import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateQuestionnaireDto, UpdateQuestionnaireDto, UpdateQuestionDto, SubmitQuestionnaireDto } from './dto/questionnaire.dto';
import { Questionnaire, QuestionnaireStatus, QuestionnaireQuestion } from './entities/questionnaire.entity';
import { AiService } from '../ai/ai.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QuestionnairesService {
  private readonly logger = new Logger(QuestionnairesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly aiService?: AiService,
  ) {}

  /**
   * Create a new questionnaire with questions - Ultra Simple Structure
   */
  async createQuestionnaire(createQuestionnaireDto: CreateQuestionnaireDto): Promise<Questionnaire> {
    const { title, questions, vendorId, generateAnswers } = createQuestionnaireDto;

    // If no vendorId provided, create a dummy vendor
    let finalVendorId = vendorId;
    if (!finalVendorId) {
      try {
        // Create a vendor for this questionnaire
        const vendorName = title.includes('Questionnaire') ? 
          title.replace('Questionnaire', '').trim() || `Company for ${title}` :
          `Company for ${title}`;

        const createVendorQuery = `
          INSERT INTO vendors (company_name, region, status, description, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          RETURNING vendor_id
        `;
        
        const vendorResult = await this.databaseService.query(createVendorQuery, [
          vendorName,
          'Unknown',
          'QUESTIONNAIRE_PENDING',
          `Auto-created vendor for questionnaire: ${title}`
        ]);
        
        finalVendorId = vendorResult.rows[0].vendor_id;
        this.logger.log(`✅ Auto-created vendor ${finalVendorId} for questionnaire: ${title}`);
      } catch (vendorError) {
        this.logger.error('❌ Failed to create vendor:', vendorError);
        throw new Error(`Failed to create vendor for questionnaire: ${vendorError.message}`);
      }
    }

    // Generate a simple batch ID for this questionnaire
    const batchId = Date.now();
    const createdQuestions: any[] = [];
    
    // First, store the questionnaire title as a special question
    const titleQuestionId = `TITLE_${batchId}`;
    const titleQuery = `
      INSERT INTO vendor_questionnaire_answers (
        id, vendor_id, question_id, question, answer, status, question_title, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW()
      )
    `;
    
    await this.databaseService.query(titleQuery, [
      finalVendorId,
      titleQuestionId,
      '__QUESTIONNAIRE_TITLE__', // Special marker for title
      title, // Store the title in the answer field
      'Metadata',
      title // Store the title in the question_title column as well
    ]);

    if (questions && questions.length > 0) {
      for (const question of questions) {
        const questionId = uuidv4();
        
        // Default status - if answers will be generated, mark as 'Pending', otherwise 'Not Started'
        const initialStatus = generateAnswers ? 'Pending' : 'Not Started';
        
        // Save each question directly linked to vendor
        const query = `
          INSERT INTO vendor_questionnaire_answers (
            id, vendor_id, question_id, question, answer, status, question_title, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW()
          ) RETURNING 
            id,
            vendor_id as "vendorId",
            question_id as "questionId",
            question,
            answer,
            status,
            question_title as "questionTitle",
            created_at as "createdAt",
            updated_at as "updatedAt"
        `;

        const values = [
          finalVendorId,
          questionId,
          question.questionText,
          '', // Empty answer initially
          initialStatus,
          title // Store the questionnaire title for all questions
        ];

        const result = await this.databaseService.query(query, values);
        createdQuestions.push(result.rows[0]);
      }
    }

    // If generateAnswers is true, generate AI answers for all questions
    if (generateAnswers && questions && questions.length > 0 && this.aiService) {
      try {
        this.logger.log(`🤖 Generating AI answers for ${questions.length} questions...`);
        
        // Extract question texts for AI generation
        const questionTexts = questions.map(q => q.questionText);
        
        // Generate AI answers using batch processing
        const aiResponse = await this.aiService.generateBatchAnswers({
          questions: questionTexts,
          vendorId: finalVendorId,
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
                WHERE question_id = $3
              `;
              
              await this.databaseService.query(updateQuery, [
                aiAnswer.answer,
                'Completed',
                createdQuestion.questionId
              ]);

              // Update the returned question object
              createdQuestion.answer = aiAnswer.answer;
              createdQuestion.status = 'Completed';
            }
          }
          
          this.logger.log(`✅ Generated ${aiResponse.metadata?.successfulAnswers || 0} AI answers successfully`);
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
      id: finalVendorId.toString(),
      title: title,
      status: finalStatus,
      vendorId: finalVendorId,
      progress: finalProgress,
      createdAt: new Date(),
      updatedAt: new Date(),
      questions: createdQuestions
    };
  }

  /**
   * Get all questionnaires (grouped by vendor and creation time patterns)
   */
  async getAllQuestionnaires(): Promise<Questionnaire[]> {
    const query = `
      SELECT 
        v.vendor_id as "vendorId",
        v.company_name as "vendorName",
        COALESCE(
          MAX(CASE WHEN vqa.question = '__QUESTIONNAIRE_TITLE__' THEN vqa.question_title END),
          CONCAT(v.company_name, '-Questionnaire')
        ) as "questionTitle",
        CASE 
          WHEN COUNT(CASE WHEN vqa.status = 'Completed' AND vqa.question != '__QUESTIONNAIRE_TITLE__' THEN 1 END) = COUNT(CASE WHEN vqa.question != '__QUESTIONNAIRE_TITLE__' THEN 1 END) THEN 'Completed'
          WHEN COUNT(CASE WHEN vqa.status != 'Not Started' AND vqa.question != '__QUESTIONNAIRE_TITLE__' THEN 1 END) > 0 THEN 'In Progress'
          ELSE 'Not Started'
        END as status,
        MIN(vqa.created_at) as "createdAt",
        MAX(vqa.updated_at) as "updatedAt",
        COUNT(CASE WHEN vqa.question != '__QUESTIONNAIRE_TITLE__' THEN 1 END) as "questionCount",
        COUNT(CASE WHEN vqa.answer != '' AND vqa.question != '__QUESTIONNAIRE_TITLE__' THEN 1 END) as "answerCount"
      FROM vendors v
      LEFT JOIN vendor_questionnaire_answers vqa ON v.vendor_id = vqa.vendor_id
      WHERE vqa.vendor_id IS NOT NULL
      GROUP BY v.vendor_id, v.company_name
      HAVING COUNT(vqa.question_id) > 0
      ORDER BY MIN(vqa.created_at) DESC
    `;

    const result = await this.databaseService.query(query);
    return result.rows.map(row => ({
      id: row.vendorId.toString(),
      title: `${row.vendorName}-${row.questionTitle}`, // Format as {Vendor_name}-{question_title}
      status: row.status as QuestionnaireStatus,
      vendorId: row.vendorId,
      vendorName: row.vendorName,
      questionTitle: row.questionTitle,
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
        v.vendor_id as "vendorId",
        v.company_name as "vendorName",
        COALESCE(
          MAX(CASE WHEN vqa.question = '__QUESTIONNAIRE_TITLE__' THEN vqa.question_title END),
          CONCAT(v.company_name, '-Questionnaire')
        ) as "questionTitle",
        CASE 
          WHEN COUNT(CASE WHEN vqa.status = 'Completed' AND vqa.question != '__QUESTIONNAIRE_TITLE__' THEN 1 END) = COUNT(CASE WHEN vqa.question != '__QUESTIONNAIRE_TITLE__' THEN 1 END) THEN 'Completed'
          WHEN COUNT(CASE WHEN vqa.status != 'Not Started' AND vqa.question != '__QUESTIONNAIRE_TITLE__' THEN 1 END) > 0 THEN 'In Progress'
          ELSE 'Not Started'
        END as status,
        MIN(vqa.created_at) as "createdAt",
        MAX(vqa.updated_at) as "updatedAt",
        COUNT(CASE WHEN vqa.question != '__QUESTIONNAIRE_TITLE__' THEN 1 END) as "questionCount",
        COUNT(CASE WHEN vqa.answer != '' AND vqa.question != '__QUESTIONNAIRE_TITLE__' THEN 1 END) as "answerCount"
      FROM vendors v
      LEFT JOIN vendor_questionnaire_answers vqa ON v.vendor_id = vqa.vendor_id
      WHERE v.vendor_id = $1 AND vqa.vendor_id IS NOT NULL
      GROUP BY v.vendor_id, v.company_name
      HAVING COUNT(vqa.question_id) > 0
      ORDER BY MIN(vqa.created_at) DESC
    `;

    const result = await this.databaseService.query(query, [parseInt(vendorId)]);
    return result.rows.map(row => ({
      id: row.vendorId.toString(),
      title: `${row.vendorName}-${row.questionTitle}`, // Format as {Vendor_name}-{question_title}
      status: row.status as QuestionnaireStatus,
      vendorId: row.vendorId,
      vendorName: row.vendorName,
      questionTitle: row.questionTitle,
      progress: row.answerCount > 0 ? Math.round((row.answerCount / row.questionCount) * 100) : 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
  }

  /**
   * Get a vendor's questionnaire by vendor ID
   */
  async getQuestionnaireById(id: string): Promise<Questionnaire | null> {
    // ID is now just the vendor ID
    const vendorId = id;
    
    // First get the title
    const titleQuery = `
      SELECT question_title as title, answer as fallback_title 
      FROM vendor_questionnaire_answers 
      WHERE vendor_id = $1 AND question = '__QUESTIONNAIRE_TITLE__' 
      LIMIT 1
    `;
    const titleResult = await this.databaseService.query(titleQuery, [parseInt(vendorId)]);
    const questionnaireTitle = titleResult.rows[0]?.title || titleResult.rows[0]?.fallback_title || `Vendor ${vendorId} Questionnaire`;

    const query = `
      SELECT 
        vqa.id,
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
      WHERE vqa.vendor_id = $1 AND vqa.question != '__QUESTIONNAIRE_TITLE__'
      ORDER BY vqa.created_at ASC
    `;

    const result = await this.databaseService.query(query, [parseInt(vendorId)]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const firstRow = result.rows[0];
    const questions = result.rows.map(row => ({
      id: row.questionId,
      vendorId: row.vendorId,
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
      id: vendorId,
      title: `${firstRow.vendorName}-${questionnaireTitle}`, // Format as {Vendor_name}-{question_title}
      status: status,
      vendorId: firstRow.vendorId,
      vendorName: firstRow.vendorName,
      questionTitle: questionnaireTitle,
      progress: progress,
      createdAt: firstRow.createdAt,
      updatedAt: firstRow.updatedAt,
      questions: questions,
      answers: answers
    };
  }

  /**
   * Get questions for a specific vendor
   */
  async getQuestionnaireQuestions(vendorId: string): Promise<QuestionnaireQuestion[]> {
    const query = `
      SELECT 
        question_id as id,
        vendor_id as "vendorId",
        question as "questionText",
        answer,
        1 as "questionOrder",
        true as "isRequired",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM vendor_questionnaire_answers 
      WHERE vendor_id = $1 AND question != '__QUESTIONNAIRE_TITLE__'
      ORDER BY created_at ASC
    `;

    const result = await this.databaseService.query(query, [parseInt(vendorId)]);
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
  async updateQuestion(vendorId: string, questionId: string, updateQuestionDto: UpdateQuestionDto): Promise<QuestionnaireQuestion | null> {
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
          vendor_id as "vendorId",
          question as "questionText",
          answer,
          1 as "questionOrder",
          true as "isRequired",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM vendor_questionnaire_answers 
        WHERE question_id = $1 AND vendor_id = $2
      `;
      
      const result = await this.databaseService.query(existingQuestionQuery, [questionId, parseInt(vendorId)]);
      return result.rows.length > 0 ? result.rows[0] : null;
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(questionId, parseInt(vendorId));

    const query = `
      UPDATE vendor_questionnaire_answers 
      SET ${updateFields.join(', ')}
      WHERE question_id = $${paramIndex} AND vendor_id = $${paramIndex + 1}
      RETURNING 
        question_id as id,
        vendor_id as "vendorId",
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
   * Delete a vendor's questionnaire (delete all questions for that vendor)
   */
  async deleteQuestionnaire(id: string): Promise<boolean> {
    try {
      // ID is now just the vendor ID
      const vendorId = id;
      console.log(`🗑️ Deleting all questions for vendor ${vendorId}`);
      
      // First, check if the vendor has any questions
      const checkQuery = `
        SELECT COUNT(*) as count 
        FROM vendor_questionnaire_answers 
        WHERE vendor_id = $1
      `;
      const checkResult = await this.databaseService.query(checkQuery, [parseInt(vendorId)]);
      const recordCount = parseInt(checkResult.rows[0].count);
      
      console.log(`📊 Found ${recordCount} questions for vendor ${vendorId}`);
      
      if (recordCount === 0) {
        console.log(`⚠️ No questions found for vendor ${vendorId}`);
        return false;
      }
      
      // Delete all questions for this vendor
      const deleteQuery = 'DELETE FROM vendor_questionnaire_answers WHERE vendor_id = $1';
      const deleteResult = await this.databaseService.query(deleteQuery, [parseInt(vendorId)]);
      
      const deletedCount = deleteResult.rowCount || 0;
      console.log(`✅ Successfully deleted ${deletedCount} questions for vendor ${vendorId}`);
      
      return deletedCount > 0;
    } catch (error) {
      console.error(`❌ Error deleting questionnaire for vendor ${id}:`, error);
      throw new Error(`Failed to delete questionnaire: ${error.message}`);
    }
  }

  /**
   * Save vendor answers for questions
   */
  async saveVendorAnswersForQuestionnaire(
    vendorId: string, 
    vendorIdParam: string, // Legacy parameter, ignore
    answers: Array<{ questionId?: string; question: string; answer: string }>
  ): Promise<any[]> {
    const savedAnswers: any[] = [];

    for (const answer of answers) {
      const query = `
        INSERT INTO vendor_questionnaire_answers (
          id, vendor_id, question_id, question, answer, status, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW()
        ) ON CONFLICT (vendor_id, question_id) 
        DO UPDATE SET 
          question = EXCLUDED.question,
          answer = EXCLUDED.answer,
          status = EXCLUDED.status,
          updated_at = NOW()
        RETURNING 
          id,
          vendor_id as "vendorId",
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
   * Get a specific vendor answer by question ID
   */
  async getVendorAnswer(vendorId: string, questionId: string): Promise<any | null> {
    try {
      const query = `
        SELECT 
          id,
          vendor_id as "vendorId",
          question_id as "questionId",
          question,
          answer,
          status,
          question_title as "questionTitle",
          share_to_trust_portal as "shareToTrustPortal",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM vendor_questionnaire_answers 
        WHERE vendor_id = $1 AND question_id = $2
      `;
      
      const result = await this.databaseService.query(query, [parseInt(vendorId), questionId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      this.logger.error(`Failed to get vendor answer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new vendor answer
   */
  async createVendorAnswer(answerData: {
    vendor_id: number;
    question_id: string;
    question: string;
    answer: string;
    status?: string;
    question_title?: string;
  }): Promise<any> {
    try {
      const query = `
        INSERT INTO vendor_questionnaire_answers (
          id, vendor_id, question_id, question, answer, status, question_title, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW()
        ) RETURNING 
          id,
          vendor_id as "vendorId",
          question_id as "questionId",
          question,
          answer,
          status,
          question_title as "questionTitle",
          share_to_trust_portal as "shareToTrustPortal",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;
      
      const values = [
        answerData.vendor_id,
        answerData.question_id,
        answerData.question,
        answerData.answer,
        answerData.status || 'pending',
        answerData.question_title || 'Questionnaire'
      ];
      
      const result = await this.databaseService.query(query, values);
      return result.rows[0];
    } catch (error) {
      this.logger.error(`Failed to create vendor answer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update a vendor answer
   */
  async updateVendorAnswer(vendorId: string, questionId: string, answerData: {
    question?: string;
    answer?: string;
    status?: string;
    question_title?: string;
  }): Promise<any | null> {
    try {
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      Object.entries(answerData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'question_title') {
            updateFields.push(`question_title = $${paramIndex}`);
          } else {
            updateFields.push(`${key} = $${paramIndex}`);
          }
          values.push(value);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        // Return existing answer if no updates
        return await this.getVendorAnswer(vendorId, questionId);
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(parseInt(vendorId), questionId);

      const query = `
        UPDATE vendor_questionnaire_answers 
        SET ${updateFields.join(', ')}
        WHERE vendor_id = $${paramIndex} AND question_id = $${paramIndex + 1}
        RETURNING 
          id,
          vendor_id as "vendorId",
          question_id as "questionId",
          question,
          answer,
          status,
          question_title as "questionTitle",
          share_to_trust_portal as "shareToTrustPortal",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      const result = await this.databaseService.query(query, values);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      this.logger.error(`Failed to update vendor answer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get questionnaires with vendor answers for a specific vendor
   */
  async getQuestionnairesWithAnswersForVendor(vendorId: string): Promise<any[]> {
    const query = `
      SELECT DISTINCT
        v.vendor_id as id,
        v.company_name as title,
        CASE 
          WHEN COUNT(CASE WHEN vqa.status = 'Completed' THEN 1 END) = COUNT(*) THEN 'Completed'
          WHEN COUNT(CASE WHEN vqa.status != 'Not Started' THEN 1 END) > 0 THEN 'In Progress'
          ELSE 'Not Started'
        END as "questionnaireStatus",
        v.vendor_id as "vendorId",
        v.company_name as "vendorName",
        MIN(vqa.created_at) as "createdAt",
        MAX(vqa.updated_at) as "updatedAt",
        COUNT(*) as "answerCount"
      FROM vendors v
      LEFT JOIN vendor_questionnaire_answers vqa ON v.vendor_id = vqa.vendor_id
      WHERE v.vendor_id = $1 AND vqa.vendor_id IS NOT NULL
      GROUP BY v.vendor_id, v.company_name
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

  /**
   * Submit questionnaire for enterprise review
   */
  async submitQuestionnaireForReview(questionnaireId: string, submitData: SubmitQuestionnaireDto): Promise<any> {
    const { vendorId, enterpriseEmail, message, checklistIds } = submitData;

    try {
      // 1. Verify questionnaire exists and belongs to vendor
      const questionnaire = await this.getQuestionnaireById(questionnaireId);
      if (!questionnaire) {
        throw new Error('Questionnaire not found');
      }

      if (questionnaire.vendorId !== vendorId) {
        throw new Error('Questionnaire does not belong to the specified vendor');
      }

      // 2. Check if questionnaire is ready for submission
      const questions = await this.getQuestionnaireQuestions(questionnaireId);
      const unansweredQuestions = questions.filter(q => !q.answer || q.answer.trim() === '');
      
      if (unansweredQuestions.length > 0) {
        throw new Error(`Questionnaire has ${unansweredQuestions.length} unanswered questions and is not ready for submission`);
      }

      // 3. Update questionnaire status to IN_REVIEW
      const updateStatusQuery = `
        UPDATE vendor_questionnaire_answers 
        SET status = $1, updated_at = NOW()
        WHERE vendor_id = $2
      `;
      await this.databaseService.query(updateStatusQuery, [QuestionnaireStatus.IN_REVIEW, vendorId]);

      // 4. Create submission record in trust portal
      const submissionId = uuidv4();
      const createSubmissionQuery = `
        INSERT INTO trust_portal_submissions (
          id, vendor_id, questionnaire_id, status, enterprise_email, message, 
          checklist_ids, submitted_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW()
        ) RETURNING *
      `;

      const submissionValues = [
        submissionId,
        vendorId,
        questionnaireId,
        'IN_REVIEW',
        enterpriseEmail,
        message || 'Questionnaire submitted for review',
        checklistIds ? JSON.stringify(checklistIds) : null
      ];

      const submissionResult = await this.databaseService.query(createSubmissionQuery, submissionValues);
      const submission = submissionResult.rows[0];

      // 5. Log activity
      this.logger.log(`✅ Questionnaire ${questionnaireId} submitted for review by vendor ${vendorId}`);

      // 6. TODO: Send notification email to enterprise (if email provided)
      if (enterpriseEmail) {
        // This would integrate with email service
        this.logger.log(`📧 Should send notification to ${enterpriseEmail} about submission ${submissionId}`);
      }

      return {
        id: submissionId,
        status: 'IN_REVIEW',
        submittedAt: new Date(),
        questionnaire: questionnaire,
        trustPortalUrl: `/trust-portal/vendor/${vendorId}?submission=${submissionId}`
      };

    } catch (error) {
      this.logger.error(`❌ Failed to submit questionnaire ${questionnaireId}:`, error);
      throw error;
    }
  }
} 