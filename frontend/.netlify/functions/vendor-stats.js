const fetch = require('node-fetch');

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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/vendors/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch vendor stats' }));
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
  } catch (error) {
    console.error('Vendor stats function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}; 