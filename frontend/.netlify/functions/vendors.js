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

console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  BACKEND_URL: BACKEND_URL
});

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    console.log('Vendor function called:', {
      method,
      backendUrl: BACKEND_URL,
      env: process.env.NODE_ENV,
      headers: event.headers,
      userAgent: event.headers['user-agent']
    });

    // First, let's test if we can reach the backend at all
    console.log('Testing backend connectivity...');
    
    if (method === 'GET') {
      // Get all vendors
      console.log(`Making GET request to: ${BACKEND_URL}/api/vendors`);
      
      const response = await fetch(`${BACKEND_URL}/api/vendors`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Netlify-Function/vendors'
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('Backend response status:', response.status);
      console.log('Backend response headers:', response.headers.raw());

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        
        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to fetch vendors',
            backendStatus: response.status,
            backendResponse: errorText,
            backendUrl: BACKEND_URL
          }),
        };
      }

      const data = await response.json();
      console.log('Successfully fetched vendors:', data);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data),
      };
    } else if (method === 'POST') {
      // Create new vendor
      const body = JSON.parse(event.body || '{}');
      console.log('Creating vendor with data:', body);

      console.log(`Making POST request to: ${BACKEND_URL}/api/vendors`);
      
      const response = await fetch(`${BACKEND_URL}/api/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Netlify-Function/vendors'
        },
        body: JSON.stringify(body),
        timeout: 30000, // 30 second timeout
      });

      console.log('Backend POST response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend POST error response:', errorText);
        
        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to create vendor',
            backendStatus: response.status,
            backendResponse: errorText,
            backendUrl: BACKEND_URL,
            requestBody: body
          }),
        };
      }

      const data = await response.json();
      console.log('Successfully created vendor:', data);
      
      return {
        statusCode: 201,
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
    console.error('Vendor function error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      type: error.type
    });
    
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
          function: 'vendors'
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
        function: 'vendors',
        backendUrl: BACKEND_URL
      }),
    };
  }
}; 