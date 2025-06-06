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
    console.log('Auth signup request:', body);

    // Validate required fields
    const { email, password, full_name, role, organization, source } = body;
    
    if (!email || !password || !full_name || !role) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: email, password, full_name, and role are required' 
        }),
      };
    }

    // Validate role
    if (!['vendor', 'enterprise'].includes(role)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Role must be either "vendor" or "enterprise"' 
        }),
      };
    }

    // Call Railway backend
    const railwayUrl = 'https://garnet-compliance-saas-production.up.railway.app/api/auth/signup';
    
    console.log('Calling Railway backend:', railwayUrl);
    
    const response = await fetch(railwayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        full_name,
        role,
        organization,
        source: source || 'netlify_signup'
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
    console.error('Auth signup error:', error);
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