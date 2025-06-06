const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://garnet-compliance-saas-production.up.railway.app'
  : 'http://localhost:5000';

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
    
    if (method === 'GET') {
      // Get all vendors
      const response = await fetch(`${BACKEND_URL}/api/vendors`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch vendors' }));
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
    } else if (method === 'POST') {
      // Create new vendor
      const body = JSON.parse(event.body || '{}');

      const response = await fetch(`${BACKEND_URL}/api/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create vendor' }));
        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify(error),
        };
      }

      const data = await response.json();
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
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}; 