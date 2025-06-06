const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    console.log('Auth login request:', body);

    // Validate required fields
    const { email, password } = body;
    
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Email and password are required' 
        }),
      };
    }

    // Call Railway backend
    const railwayUrl = 'https://garnet-compliance-saas-production.up.railway.app/api/auth/login';
    
    console.log('Calling Railway backend:', railwayUrl);
    
    const response = await fetch(railwayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password
      }),
    });

    const responseData = await response.json();
    console.log('Railway response status:', response.status);
    console.log('Railway response data:', responseData);

    // Return the response from Railway
    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify(responseData),
    };

  } catch (error) {
    console.error('Auth login error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
    };
  }
}; 