// Netlify serverless function to handle waitlist signup
// This will proxy the request to the Railway backend

const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Log the request for debugging
  console.log('Function invoked: waitlist-signup');
  console.log('Request path:', event.path);
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }

  // Add CORS headers for preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // Parse the incoming request body
    const userData = JSON.parse(event.body);
    console.log('Received signup request for:', userData.email);

    // Multiple possible Railway backend URLs to try
    const possibleUrls = [
      'https://garnet-compliance-saas-production.up.railway.app/api/waitlist/signup',
      'https://garnet-compliance-saas-production.up.railway.app:8080/api/waitlist/signup',
      'http://garnet-compliance-saas-production.up.railway.app:8080/api/waitlist/signup'
    ];

    let response = null;
    let responseData = null;
    let error = null;

    // Try each URL until one works
    for (const backendUrl of possibleUrls) {
      try {
        console.log('Trying connection to:', backendUrl);
        
        response = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'https://testinggarnet.netlify.app'
          },
          body: JSON.stringify(userData)
        });

        console.log(`Response from ${backendUrl}: status ${response.status}`);
        
        if (response.ok) {
          responseData = await response.json();
          console.log('Railway response data:', JSON.stringify(responseData));
          break;  // Exit the loop if successful
        }
      } catch (err) {
        console.log(`Error with ${backendUrl}:`, err.message);
        error = err;
        // Continue to next URL
      }
    }

    // If we have a successful response
    if (response && response.ok && responseData) {
      return {
        statusCode: response.status,
        body: JSON.stringify(responseData),
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }
    
    // If we got a non-ok response but still a response
    if (response) {
      try {
        const errorData = await response.json();
        return {
          statusCode: response.status,
          body: JSON.stringify(errorData),
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        };
      } catch (e) {
        // If we can't parse the error response
        return {
          statusCode: response.status || 500,
          body: JSON.stringify({ 
            error: 'Error from Railway backend',
            status: response.status,
            statusText: response.statusText
          }),
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        };
      }
    }
    
    // If we didn't get any valid response
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to connect to backend service', 
        details: error ? error.message : 'Unknown error'
      }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
    
  } catch (error) {
    console.error('Error in waitlist-signup function:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error in waitlist signup function',
        details: error.message
      }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
}; 