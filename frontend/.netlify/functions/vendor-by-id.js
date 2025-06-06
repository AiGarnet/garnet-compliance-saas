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

console.log('Vendor-by-id function - Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  BACKEND_URL: BACKEND_URL
});

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
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
    
    // Extract vendor ID from query string
    const vendorId = event.queryStringParameters?.id;
    
    console.log('Vendor-by-id function called:', {
      method,
      vendorId,
      backendUrl: BACKEND_URL,
      queryParams: event.queryStringParameters
    });
    
    if (!vendorId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Vendor ID is required' }),
      };
    }

    if (method === 'GET') {
      // Get vendor by ID
      console.log(`Making GET request to: ${BACKEND_URL}/api/vendors/${vendorId}`);
      
      const response = await fetch(`${BACKEND_URL}/api/vendors/${vendorId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Netlify-Function/vendor-by-id'
        },
        timeout: 30000,
      });

      console.log('Backend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        
        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to fetch vendor',
            backendStatus: response.status,
            backendResponse: errorText,
            vendorId: vendorId
          }),
        };
      }

      const data = await response.json();
      console.log('Successfully fetched vendor:', data);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data),
      };
    } else if (method === 'PUT') {
      // Update vendor
      const body = JSON.parse(event.body || '{}');

      const response = await fetch(`${BACKEND_URL}/api/vendors/${vendorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to update vendor' }));
        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify(error),
        };
      }

      const data = await response.json();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data),
      };
    } else if (method === 'DELETE') {
      // Delete vendor
      const response = await fetch(`${BACKEND_URL}/api/vendors/${vendorId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to delete vendor' }));
        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify(error),
        };
      }

      const data = await response.json();
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
    console.error('Vendor-by-id function error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
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
          function: 'vendor-by-id'
        }),
      };
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        function: 'vendor-by-id',
        backendUrl: BACKEND_URL
      }),
    };
  }
}; 