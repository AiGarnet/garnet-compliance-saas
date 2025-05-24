// Netlify serverless function to list waitlist signups

const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
  // Log the request for debugging
  console.log('Function invoked: list-waitlist');
  
  // Add CORS headers for all responses
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };
  
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    console.log('Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Get authorization header to check for admin access
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    // In a real app, we'd check a proper JWT or API key here
    // For this example, we'll use a simple shared secret for demo purposes
    const ADMIN_SECRET = process.env.ADMIN_SECRET || 'demo-admin-secret';
    
    if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }
    
    // File path for waitlist data
    const dataFilePath = path.join('/tmp', 'waitlist-data.json');
    
    // Check if file exists and read data
    if (!fs.existsSync(dataFilePath)) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          count: 0,
          entries: []
        })
      };
    }
    
    // Read and parse waitlist data
    const fileData = fs.readFileSync(dataFilePath, 'utf8');
    const waitlistData = JSON.parse(fileData);
    
    // Return waitlist data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        count: waitlistData.length,
        entries: waitlistData
      })
    };
    
  } catch (error) {
    console.error('Error in list-waitlist function:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Error retrieving waitlist data',
        details: error.message
      })
    };
  }
}; 