const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://garnet-compliance-saas-production.up.railway.app'
  : 'http://localhost:5000';

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
    
    if (!vendorId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Vendor ID is required' }),
      };
    }

    if (method === 'GET') {
      // Get vendor by ID
      const response = await fetch(`${BACKEND_URL}/api/vendors/${vendorId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch vendor' }));
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
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}; 