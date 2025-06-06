// Try to use built-in fetch first, fallback to node-fetch
let fetch;
try {
  fetch = globalThis.fetch;
  if (!fetch) {
    fetch = require('node-fetch');
  }
} catch (error) {
  console.log('Falling back to node-fetch:', error.message);
  fetch = require('node-fetch');
}

const BACKEND_URL = 'https://garnet-compliance-saas-production.up.railway.app';

exports.handler = async (event, context) => {
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
    console.log('Testing backend connectivity...');
    console.log('Backend URL:', BACKEND_URL);
    console.log('Node.js version:', process.version);
    console.log('Environment:', process.env.NODE_ENV);
    
    // Test basic connectivity to backend root
    console.log('Step 1: Testing root endpoint');
    const rootResponse = await fetch(`${BACKEND_URL}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Test-Function'
      },
      timeout: 15000,
    });
    
    console.log('Root response status:', rootResponse.status);
    const rootData = await rootResponse.text();
    console.log('Root response data:', rootData);
    
    // Test vendor endpoint
    console.log('Step 2: Testing vendor endpoint');
    const vendorResponse = await fetch(`${BACKEND_URL}/api/vendors`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Test-Function'
      },
      timeout: 15000,
    });
    
    console.log('Vendor endpoint status:', vendorResponse.status);
    
    let vendorData;
    try {
      vendorData = await vendorResponse.text();
      console.log('Vendor response data:', vendorData);
    } catch (parseError) {
      console.error('Failed to parse vendor response:', parseError);
      vendorData = 'Failed to parse response';
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        backendUrl: BACKEND_URL,
        rootStatus: rootResponse.status,
        vendorStatus: vendorResponse.status,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV,
        rootResponse: rootData.substring(0, 500), // Limit response size
        vendorResponse: vendorData.substring(0, 500),
        timestamp: new Date().toISOString()
      }),
    };
    
  } catch (error) {
    console.error('Test function error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Test function failed',
        details: error.message,
        errorCode: error.code,
        errorType: error.name,
        backendUrl: BACKEND_URL,
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
      }),
    };
  }
}; 