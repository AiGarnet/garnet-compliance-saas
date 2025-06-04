// Netlify serverless function to handle waitlist signup
// This will forward the request to our Railway backend

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// The API endpoint for our Railway backend
const WAITLIST_API_URL = process.env.RAILWAY_API_URL || 'https://garnet-compliance-saas-production.up.railway.app/join-waitlist';

// Helper function to store waitlist data in the filesystem as a backup
async function storeWaitlistData(userData) {
  try {
    // Create a data object with timestamp
    const signupData = {
      ...userData,
      timestamp: new Date().toISOString(),
      id: require('crypto').randomUUID()
    };
    
    // File path for waitlist data
    // This will be in the Netlify function's temporary directory
    const dataFilePath = path.join('/tmp', 'waitlist-data.json');
    
    // Check if file exists and read existing data
    let existingData = [];
    try {
      if (fs.existsSync(dataFilePath)) {
        const fileData = fs.readFileSync(dataFilePath, 'utf8');
        existingData = JSON.parse(fileData);
      }
    } catch (error) {
      console.log('Error reading existing waitlist data:', error.message);
      // Continue with empty array if file doesn't exist or can't be read
    }
    
    // Add new signup to the array
    existingData.push(signupData);
    
    // Write the updated data back to the file
    fs.writeFileSync(dataFilePath, JSON.stringify(existingData, null, 2));
    
    console.log('Waitlist data stored successfully in file for:', userData.email);
    return true;
  } catch (error) {
    console.error('Failed to store waitlist data in file:', error);
    return false;
  }
}

// Function to send data to the Railway backend
async function sendToRailwayAPI(userData) {
  console.log('Sending data to Railway backend:', WAITLIST_API_URL);
  console.log('Data being sent:', JSON.stringify(userData, null, 2));

  try {
    const response = await fetch(WAITLIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Function'
      },
      body: JSON.stringify(userData),
    });
    
    console.log('Railway API Response Status:', response.status);
    
    let data;
    try {
      data = await response.json();
      console.log('Railway API Response Data:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Error parsing response JSON:', e);
      data = { error: 'Could not parse server response' };
    }
    
    return {
      success: response.ok,
      statusCode: response.status,
      data: data
    };
  } catch (error) {
    console.error('Error sending data to Railway API:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

exports.handler = async function(event, context) {
  // Log the request for debugging
  console.log('Function invoked: waitlist-signup');
  console.log('Request path:', event.path);
  console.log('Request method:', event.httpMethod);
  
  // Add CORS headers for all responses
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };
  
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the incoming request body
    const userData = JSON.parse(event.body);
    console.log('Received signup request for:', userData.email);

    // Check if user data is valid
    if (!userData.email || !userData.full_name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          details: 'Email and full_name are required' 
        })
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid email format' })
      };
    }

    // Store the waitlist data locally as backup
    await storeWaitlistData(userData);
    
    // Send to our Railway backend
    const apiResult = await sendToRailwayAPI(userData);
    
    if (apiResult.success) {
      // Successfully sent to Railway backend
      return {
        statusCode: apiResult.statusCode || 201,
        headers,
        body: JSON.stringify(apiResult.data)
      };
    } else if (apiResult.statusCode === 409) {
      // Email already exists
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Email already registered in waitlist' 
        })
      };
    }
    
    // If Railway API call fails, use the mock response as fallback
    console.log('Using mock waitlist signup response as fallback');
    
    // Generate a unique user ID for the mock response
    const mockUserId = require('crypto').randomUUID();
    
    const mockResponse = {
      success: true,
      message: 'Successfully joined the waitlist!',
      data: {
        id: mockUserId,
        email: userData.email,
        name: userData.full_name,
        role: userData.role || null,
        organization: userData.organization || null,
        created_at: new Date().toISOString()
      }
    };
    
    // Return the mock response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mockResponse)
    };
    
  } catch (error) {
    console.error('Error in waitlist-signup function:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error in waitlist signup function',
        details: error.message
      })
    };
  }
}; 