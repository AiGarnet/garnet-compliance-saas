import pool from '../config/database';
import { Questionnaire, QuestionnaireQuestion, QuestionnaireStatus } from '../types/questionnaire';

export class QuestionnaireRepository {

  /**
   * Create a new questionnaire using the simple questionnaires table
   */
  async createQuestionnaire(title: string, questions: string[]): Promise<Questionnaire> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create a unique questionnaire ID using title and timestamp
      const questionnaireId = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
      
      // Insert each question as a separate row with the same vendor_id as grouping
      const questionPromises = questions.map((questionText, index) => {
        const questionQuery = `
          INSERT INTO questionnaires (question, answer, status, law_tag, vendor_id)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        
        return client.query(questionQuery, [
          questionText,
          null, // No answer initially
          QuestionnaireStatus.NOT_STARTED,
          questionnaireId, // Using law_tag to group questions by questionnaire
          null // No vendor association for standalone questionnaires
        ]);
      });
      
      const questionResults = await Promise.all(questionPromises);
      
      await client.query('COMMIT');
      
      // Format the response
      const formattedQuestionnaire: Questionnaire = {
        id: questionnaireId,
        title: title,
        status: QuestionnaireStatus.NOT_STARTED,
        progress: 0,
        createdAt: questionResults[0]?.rows[0]?.created_at || new Date(),
        updatedAt: questionResults[0]?.rows[0]?.updated_at || new Date(),
        questions: questionResults.map((result, index) => ({
          id: result.rows[0].questionnaire_id.toString(),
          questionnaireId: questionnaireId,
          questionText: result.rows[0].question,
          answer: result.rows[0].answer,
          questionOrder: index + 1,
          isRequired: true,
          createdAt: result.rows[0].created_at,
          updatedAt: result.rows[0].updated_at
        }))
      };
      
      return formattedQuestionnaire;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all questionnaires (grouped by law_tag)
   */
  async getAllQuestionnaires(): Promise<Questionnaire[]> {
    const query = `
      SELECT 
        law_tag as questionnaire_id,
        MIN(created_at) as created_at,
        MAX(updated_at) as updated_at,
        ARRAY_AGG(
          json_build_object(
            'id', questionnaire_id,
            'questionnaireId', law_tag,
            'questionText', question,
            'answer', answer,
            'questionOrder', ROW_NUMBER() OVER (PARTITION BY law_tag ORDER BY questionnaire_id),
            'isRequired', true,
            'createdAt', created_at,
            'updatedAt', updated_at
          ) ORDER BY questionnaire_id
        ) as questions,
        status
      FROM questionnaires
      WHERE law_tag IS NOT NULL
      GROUP BY law_tag, status
      ORDER BY MIN(created_at) DESC
    `;
    
    const result = await pool.query(query);
    
    return result.rows.map(row => {
      // Extract title from law_tag (remove timestamp suffix)
      const title = row.questionnaire_id.replace(/_\d+$/, '').replace(/_/g, ' ');
      
      // Calculate progress
      const totalQuestions = row.questions.length;
      const answeredQuestions = row.questions.filter((q: any) => q.answer && q.answer.trim().length > 0).length;
      const progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
      
      // Determine status based on progress
      let status = QuestionnaireStatus.NOT_STARTED;
      if (progress === 100) {
        status = QuestionnaireStatus.COMPLETED;
      } else if (progress > 0) {
        status = QuestionnaireStatus.IN_PROGRESS;
      }
      
      return {
        id: row.questionnaire_id,
        title: title,
        status: status,
        progress: progress,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        questions: row.questions
      };
    });
  }

  /**
   * Get a specific questionnaire by ID
   */
  async getQuestionnaireById(id: string): Promise<Questionnaire | null> {
    const query = `
      SELECT 
        questionnaire_id,
        question,
        answer,
        status,
        created_at,
        updated_at
      FROM questionnaires
      WHERE law_tag = $1
      ORDER BY questionnaire_id
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    // Extract title from law_tag
    const title = id.replace(/_\d+$/, '').replace(/_/g, ' ');
    
    // Calculate progress
    const totalQuestions = result.rows.length;
    const answeredQuestions = result.rows.filter(row => row.answer && row.answer.trim().length > 0).length;
    const progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
    
    // Determine status
    let status = QuestionnaireStatus.NOT_STARTED;
    if (progress === 100) {
      status = QuestionnaireStatus.COMPLETED;
    } else if (progress > 0) {
      status = QuestionnaireStatus.IN_PROGRESS;
    }
    
    return {
      id: id,
      title: title,
      status: status,
      progress: progress,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
      questions: result.rows.map((row, index) => ({
        id: row.questionnaire_id.toString(),
        questionnaireId: id,
        questionText: row.question,
        answer: row.answer,
        questionOrder: index + 1,
        isRequired: true,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    };
  }

  /**
   * Get questions for a specific questionnaire
   */
  async getQuestionnaireQuestions(questionnaireId: string): Promise<QuestionnaireQuestion[]> {
    const questionnaire = await this.getQuestionnaireById(questionnaireId);
    return questionnaire ? questionnaire.questions : [];
  }

  /**
   * Update a questionnaire title (updates law_tag)
   */
  async updateQuestionnaire(
    id: string, 
    updates: { title?: string; status?: string }
  ): Promise<Questionnaire | null> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      if (updates.title) {
        // Create new law_tag with updated title
        const newId = `${updates.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
        
        await client.query(
          'UPDATE questionnaires SET law_tag = $1 WHERE law_tag = $2',
          [newId, id]
        );
        
        await client.query('COMMIT');
        return this.getQuestionnaireById(newId);
      }
      
      if (updates.status) {
        await client.query(
          'UPDATE questionnaires SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE law_tag = $2',
          [updates.status, id]
        );
      }
      
      await client.query('COMMIT');
      return this.getQuestionnaireById(id);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update a specific question answer
   */
  async updateQuestion(
    questionnaireId: string, 
    questionId: string, 
    updates: { question?: string; answer?: string }
  ): Promise<QuestionnaireQuestion | null> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const setClause = [];
      const values = [];
      let paramCount = 1;

      if (updates.question !== undefined) {
        setClause.push(`question = $${paramCount}`);
        values.push(updates.question);
        paramCount++;
      }

      if (updates.answer !== undefined) {
        setClause.push(`answer = $${paramCount}`);
        values.push(updates.answer);
        paramCount++;
      }

      if (setClause.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(parseInt(questionId));
      values.push(questionnaireId);

      const query = `
        UPDATE questionnaires 
        SET ${setClause.join(', ')}
        WHERE questionnaire_id = $${paramCount} AND law_tag = $${paramCount + 1}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      
      return {
        id: row.questionnaire_id.toString(),
        questionnaireId: questionnaireId,
        questionText: row.question,
        answer: row.answer,
        questionOrder: 1, // We'll need to calculate this properly
        isRequired: true,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a questionnaire
   */
  async deleteQuestionnaire(id: string): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        'DELETE FROM questionnaires WHERE law_tag = $1',
        [id]
      );
      
      await client.query('COMMIT');
      
      return (result.rowCount || 0) > 0;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update questionnaire progress - not needed since we calculate it dynamically
   */
  private async updateQuestionnaireProgress(questionnaireId: string): Promise<void> {
    // Progress is calculated dynamically in getQuestionnaireById
    // No need to store it in the database
  }
} 