const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log('Netlify Function: Received waitlist signup request');
    console.log('Event body:', event.body);

    // Parse the request body
    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }

    // Validate required fields
    if (!requestData.email || !requestData.full_name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: email and full_name are required' 
        }),
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requestData.email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid email format' }),
      };
    }

    // Railway backend URL
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app';
    const waitlistEndpoint = `${BACKEND_URL}/join-waitlist`;

    console.log('Netlify Function: Forwarding to Railway backend:', waitlistEndpoint);
    console.log('Data being sent:', JSON.stringify(requestData));

    // Forward the request to Railway backend
    const railwayResponse = await fetch(waitlistEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Function/1.0',
      },
      body: JSON.stringify({
        email: requestData.email,
        full_name: requestData.full_name,
        role: requestData.role || null,
        organization: requestData.organization || null,
      }),
    });

    console.log('Railway response status:', railwayResponse.status);

    // Parse Railway response
    let railwayData;
    try {
      railwayData = await railwayResponse.json();
      console.log('Railway response data:', railwayData);
    } catch (parseError) {
      console.error('Error parsing Railway response:', parseError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Invalid response from backend service' }),
      };
    }

    // Return the Railway response with appropriate status code
    if (railwayResponse.ok) {
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          message: railwayData.message || 'Successfully joined the waitlist!',
          data: railwayData.data,
        }),
      };
    } else {
      // Handle different error cases
      let statusCode = railwayResponse.status;
      let errorMessage = railwayData.error || 'Unknown error occurred';

      // Map specific error cases
      if (statusCode === 409) {
        errorMessage = 'Email already registered in waitlist';
      } else if (statusCode === 400) {
        errorMessage = railwayData.error || 'Invalid request data';
      } else if (statusCode >= 500) {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
        statusCode = 503;
      }

      console.error('Railway backend error:', errorMessage);
      
      return {
        statusCode,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: errorMessage 
        }),
      };
    }

  } catch (error) {
    console.error('Netlify Function error:', error);
    
    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ 
          error: 'Backend service unavailable. Please try again later.' 
        }),
      };
    }

    // Handle fetch timeout or other network issues
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ 
          error: 'Network error. Please check your connection and try again.' 
        }),
      };
    }

    // Generic error
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error. Please try again later.' 
      }),
    };
  }
}; 