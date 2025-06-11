// Railway Backend API URL
const BACKEND_API_URL = 'https://garnet-compliance-saas-production.up.railway.app/api/questionnaires';

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

    let backendUrl = BACKEND_API_URL;
    let fetchOptions = {
      method: httpMethod,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Build the appropriate backend URL and request
    switch (httpMethod) {
      case 'GET':
        if (questionnaireId && questionnaireId !== 'questionnaires') {
          backendUrl = `${BACKEND_API_URL}/${questionnaireId}`;
        }
        break;
      
      case 'POST':
        fetchOptions.body = body;
        break;
      
      case 'PUT':
        backendUrl = `${BACKEND_API_URL}/${questionnaireId}`;
        fetchOptions.body = body;
        break;
      
      case 'DELETE':
        backendUrl = `${BACKEND_API_URL}/${questionnaireId}`;
        break;
      
      default:
        return {
          statusCode: 405,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    console.log('🚀 Calling backend:', backendUrl, fetchOptions.method);

    // Make request to Railway backend
    const response = await fetch(backendUrl, fetchOptions);
    const data = await response.text();
    
    console.log('📡 Backend response:', response.status, data.substring(0, 200));

    // Parse response if it's JSON
    let responseData;
    try {
      responseData = JSON.parse(data);
    } catch (e) {
      responseData = { message: data };
    }

    return {
      statusCode: response.status,
      headers: corsHeaders,
      body: JSON.stringify(responseData),
    };

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