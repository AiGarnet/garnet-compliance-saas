export async function handler(event, context) {
  // Only handle POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  try {
    const { questions } = JSON.parse(event.body);
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request. Please provide an array of questions.' })
      };
    }
    
    // Mock responses for demonstration
    const mockResponses = [
      "Our system uses AES-256 encryption for all data at rest and in transit.",
      "We have a comprehensive disaster recovery plan that is tested quarterly.",
      "Our platform is SOC 2 Type II compliant, with annual audits conducted by an independent third party.",
      "We maintain a detailed audit log of all system access and modifications for a minimum of one year.",
      "Our data centers are ISO 27001 certified and provide 99.99% uptime reliability.",
      "We conduct regular penetration testing and vulnerability assessments on a quarterly basis.",
      "All user data is backed up daily and stored in redundant locations.",
      "Our identity management system supports SAML 2.0 and OAuth 2.0 for single sign-on (SSO) integration.",
      "We implement strict access controls based on the principle of least privilege.",
      "Our security team conducts regular code reviews and security assessments."
    ];
    
    // Generate an answer for each question
    const answers = questions.map((_, index) => {
      // Use modulo to cycle through mock responses if we have more questions than mock answers
      return mockResponses[index % mockResponses.length];
    });
    
    // Add a small delay to simulate processing time (optional)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ answers })
    };
  } catch (error) {
    console.error('Error processing questionnaire:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ error: 'An error occurred while processing your request.' })
    };
  }
} 