// Simple health check function to verify Netlify Functions are working properly
exports.handler = async function() {
  // Return basic information about the environment
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    },
    body: JSON.stringify({
      status: 'ok',
      message: 'Netlify Functions are working properly',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      nodeVersion: process.version
    })
  };
}; 