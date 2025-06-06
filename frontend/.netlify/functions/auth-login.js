// Auth login function - calls Railway backend

const handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  console.log('Auth login function called:', {
    method: event.httpMethod,
    path: event.path,
    headers: event.headers
  });

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { email, password } = body;

    console.log('Login attempt for email:', email);

    // Validate required fields
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email and password are required' })
      };
    }

    // Call Railway backend for login
    const railwayResponse = await fetch('https://garnet-compliance-saas-production.up.railway.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    console.log('Railway response status:', railwayResponse.status);

    // Parse Railway response
    let railwayData;
    try {
      railwayData = await railwayResponse.json();
      console.log('Railway response data:', railwayData);
    } catch (e) {
      console.error('Error parsing Railway response:', e);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Failed to process login request - invalid response from server'
        })
      };
    }

    // Return Railway response to frontend
    if (railwayResponse.ok) {
      console.log('User logged in successfully via Railway backend');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(railwayData)
      };
    } else {
      return {
        statusCode: railwayResponse.status,
        headers,
        body: JSON.stringify(railwayData)
      };
    }

  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to process login request',
        details: error.message
      })
    };
  }
};

module.exports = { handler }; 