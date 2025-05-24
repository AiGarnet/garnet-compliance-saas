// Netlify serverless function to handle waitlist signup
// This will proxy the request to the Railway backend

const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    // Parse the incoming request body
    const userData = JSON.parse(event.body);
    console.log('Received signup request for:', userData.email);

    // Forward the request to the Railway backend
    const backendUrl = 'https://garnet-compliance-saas-production.up.railway.app/api/waitlist/signup';
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    // Get the response data
    const responseData = await response.json();
    
    // Return the response with appropriate status
    return {
      statusCode: response.status,
      body: JSON.stringify(responseData),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    console.error('Error forwarding request to backend:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error forwarding request to backend' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}; 