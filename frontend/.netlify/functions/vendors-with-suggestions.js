// Try to use built-in fetch first, fallback to node-fetch
let fetch;
try {
  // Check if global fetch is available (Node 18+)
  fetch = globalThis.fetch;
  if (!fetch) {
    fetch = require('node-fetch');
  }
} catch (error) {
  console.log('Falling back to node-fetch:', error.message);
  fetch = require('node-fetch');
}

// Determine backend URL - prioritize explicit env var, then check for production environment
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL 
  || (process.env.NODE_ENV === 'production' ? 'https://garnet-compliance-saas-production.up.railway.app' : null)
  || 'https://garnet-compliance-saas-production.up.railway.app'; // Default to production backend

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const method = event.httpMethod;
    console.log('Vendors with suggestions function called:', {
      method,
      backendUrl: BACKEND_URL
    });

    if (method === 'GET') {
      // Get vendors with AI suggestions
      console.log(`Making GET request to: ${BACKEND_URL}/api/vendors/with-suggestions`);
      
      const response = await fetch(`${BACKEND_URL}/api/vendors/with-suggestions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Netlify-Function/vendors-with-suggestions'
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('Backend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        
        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to fetch vendors with suggestions',
            backendStatus: response.status,
            backendResponse: errorText,
            backendUrl: BACKEND_URL
          }),
        };
      }

      const data = await response.json();
      console.log('Successfully fetched vendors with suggestions:', data);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data),
      };
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }
  } catch (error) {
    console.error('Vendors with suggestions function error:', error);
    
    // Check if it's a network/connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ 
          error: 'Backend service unavailable',
          details: error.message,
          errorCode: error.code,
          backendUrl: BACKEND_URL,
          function: 'vendors-with-suggestions'
        }),
      };
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        errorType: error.name,
        function: 'vendors-with-suggestions',
        backendUrl: BACKEND_URL
      }),
    };
  }
}; 