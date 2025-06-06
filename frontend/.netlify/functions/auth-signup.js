// Auth signup function - calls Railway backend

const handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  console.log('Auth signup function called:', {
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
    const { email, password, full_name, role, organization } = body;

    console.log('Signup attempt for email:', email);

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: email, password, full_name, and role are required'
        })
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid email format' })
      };
    }

    // Validate password strength
    if (password.length < 8) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Password must be at least 8 characters long' })
      };
    }

    // Validate role
    if (!['vendor', 'enterprise'].includes(role)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Role must be either "vendor" or "enterprise"' })
      };
    }

    // Call Railway backend for signup
    const railwayResponse = await fetch('https://garnet-compliance-saas-production.up.railway.app/api/auth/signup', {
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
        source: 'auth_signup'
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
          error: 'Failed to process signup request - invalid response from server'
        })
      };
    }

    // Return Railway response to frontend
    if (railwayResponse.ok) {
      console.log('User created successfully via Railway backend');
      return {
        statusCode: 201,
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
    console.error('Signup error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to process signup request',
        details: error.message
      })
    };
  }
};

module.exports = { handler }; 