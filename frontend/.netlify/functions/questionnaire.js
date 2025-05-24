// Netlify function to handle questionnaire creation
exports.handler = async function(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  // Only handle POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  try {
    const body = JSON.parse(event.body);
    const { title, questions } = body;
    
    // Generate a random ID
    const id = `q${Date.now().toString(36)}`;
    
    // Generate a random due date in the next 30 days
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) + 1);
    const formattedDueDate = dueDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    // Store the questionnaire in memory (in a real app, this would go to a database)
    // In this demo, we'll just return a mock response since we can't persist data between requests
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        success: true,
        message: 'Questionnaire created successfully',
        questionnaire: {
          id,
          name: title,
          status: 'Not Started',
          dueDate: formattedDueDate,
          progress: 0,
          questions
        }
      })
    };
  } catch (error) {
    console.error('Error processing questionnaire:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ success: false, message: 'Failed to process questionnaire' })
    };
  }
}; 