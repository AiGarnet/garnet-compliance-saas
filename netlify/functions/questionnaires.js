import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: { rejectUnauthorized: false }
});

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

export async function handler(event, context) {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    const { httpMethod, path, body } = event;
    
    // Extract questionnaire ID from path
    const pathSegments = path.split('/');
    const questionnaireId = pathSegments[pathSegments.length - 1];
    
    console.log('🔍 Questionnaire API request:', { httpMethod, path, questionnaireId });

    switch (httpMethod) {
      case 'GET':
        return await getQuestionnaire(questionnaireId);
      
      case 'POST':
        return await createQuestionnaire(JSON.parse(body || '{}'));
      
      case 'PUT':
        return await updateQuestionnaire(questionnaireId, JSON.parse(body || '{}'));
      
      case 'DELETE':
        return await deleteQuestionnaire(questionnaireId);
      
      default:
        return {
          statusCode: 405,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('❌ Questionnaire API error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
    };
  }
}

async function getQuestionnaire(questionnaireId) {
  try {
    console.log('📋 Getting questionnaire:', questionnaireId);
    
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
    
    const result = await pool.query(query, [questionnaireId]);
    
    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Questionnaire not found' }),
      };
    }
    
    // Extract title from law_tag
    const title = questionnaireId.replace(/_\d+$/, '').replace(/_/g, ' ');
    
    // Calculate progress
    const totalQuestions = result.rows.length;
    const answeredQuestions = result.rows.filter(row => row.answer && row.answer.trim().length > 0).length;
    const progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
    
    // Determine status
    let status = 'Not Started';
    if (progress === 100) {
      status = 'Completed';
    } else if (progress > 0) {
      status = 'In Progress';
    }
    
    const questionnaire = {
      id: questionnaireId,
      title: title,
      status: status,
      progress: progress,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
      questions: result.rows.map((row, index) => ({
        id: row.questionnaire_id.toString(),
        questionnaireId: questionnaireId,
        questionText: row.question,
        answer: row.answer,
        questionOrder: index + 1,
        isRequired: true,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    };
    
    console.log('✅ Retrieved questionnaire:', questionnaire.title);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(questionnaire),
    };
  } catch (error) {
    console.error('❌ Error getting questionnaire:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to get questionnaire',
        details: error.message 
      }),
    };
  }
}

async function createQuestionnaire(data) {
  try {
    const { title, questions } = data;
    
    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid questionnaire data' }),
      };
    }
    
    console.log('📝 Creating questionnaire:', title, 'with', questions.length, 'questions');
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const questionnaireId = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
      
      const questionPromises = questions.map((questionText, index) => {
        const questionQuery = `
          INSERT INTO questionnaires (question, answer, status, law_tag, vendor_id)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        
        return client.query(questionQuery, [
          questionText,
          null,
          'Not Started',
          questionnaireId,
          null
        ]);
      });
      
      const questionResults = await Promise.all(questionPromises);
      await client.query('COMMIT');
      
      const questionnaire = {
        id: questionnaireId,
        title: title,
        status: 'Not Started',
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
      
      console.log('✅ Created questionnaire:', questionnaire.id);
      
      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(questionnaire),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error creating questionnaire:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to create questionnaire',
        details: error.message 
      }),
    };
  }
}

async function updateQuestionnaire(questionnaireId, data) {
  try {
    // Implementation for updating questionnaire
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Update questionnaire endpoint - coming soon' }),
    };
  } catch (error) {
    console.error('❌ Error updating questionnaire:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to update questionnaire',
        details: error.message 
      }),
    };
  }
}

async function deleteQuestionnaire(questionnaireId) {
  try {
    // Implementation for deleting questionnaire
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Delete questionnaire endpoint - coming soon' }),
    };
  } catch (error) {
    console.error('❌ Error deleting questionnaire:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to delete questionnaire',
        details: error.message 
      }),
    };
  }
} 