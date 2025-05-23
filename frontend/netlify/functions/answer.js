const fs = require('fs');
const path = require('path');

// Load the compliance data
let complianceData = [];
try {
  // Path is relative to the function's directory, need to go up to find public folder
  const dataPath = path.join(__dirname, '../../public/data_new.json');
  
  if (fs.existsSync(dataPath)) {
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    complianceData = JSON.parse(rawData);
    console.log(`Loaded ${complianceData.length} compliance records`);
  } else {
    console.error(`Data file not found at ${dataPath}`);
  }
} catch (error) {
  console.error('Error loading compliance data:', error);
}

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
    const { question } = JSON.parse(event.body);
    
    if (!question) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ error: 'Question is required' })
      };
    }

    // Find relevant data based on the question
    const relevantData = findRelevantComplianceData(question, complianceData);
    
    // Generate answer from the relevant data
    const answer = generateAnswer(question, relevantData);
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ 
        question, 
        answer,
        timestamp: new Date().toISOString() 
      })
    };
    
  } catch (error) {
    console.error('Error processing question:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: error.message || 'Error processing your question' })
    };
  }
};

// Helper function to find relevant compliance data
function findRelevantComplianceData(question, data) {
  if (!data || data.length === 0) {
    return [];
  }
  
  // Convert question to lowercase for case-insensitive matching
  const questionLower = question.toLowerCase();
  
  // Define common categories and domains to look for
  const categories = [
    'Data Privacy', 'Data Security', 'Cybersecurity', 'Compliance', 
    'Financial Privacy', 'Public Sector Privacy', 'GDPR', 'HIPAA', 'CCPA',
    'Encryption', 'Access Control', 'Audit', 'Authentication', 'Authorization',
    'Data Retention', 'Data Deletion', 'Breach Notification', 'Risk Assessment'
  ];
  
  // Extract key phrases from the question
  const questionPhrases = extractKeyPhrases(questionLower);
  
  // Check if question contains any categories
  const matchedCategories = categories.filter(category => 
    questionLower.includes(category.toLowerCase())
  );
  
  // Score each data item based on relevance to the question
  const scoredData = data.map(item => {
    let score = 0;
    
    // Category matches are highly relevant
    if (matchedCategories.includes(item.category)) {
      score += 10;
    }
    
    // Check for domain matches
    if (item.domains) {
      for (const domain of item.domains) {
        if (questionLower.includes(domain.toLowerCase())) {
          score += 5;
        }
      }
    }
    
    // Check for name matches (e.g., "GDPR", "HIPAA")
    if (questionLower.includes(item.name.toLowerCase())) {
      score += 15;
    }
    
    // Check for jurisdiction matches
    if (questionLower.includes(item.jurisdiction?.toLowerCase() || '')) {
      score += 3;
    }
    
    // Look for specific keyword matches in description and requirements
    const descriptionLower = item.description?.toLowerCase() || '';
    const requirementLower = item.requirement?.toLowerCase() || '';
    
    // Check for phrase matches (more important than single words)
    for (const phrase of questionPhrases) {
      if (descriptionLower.includes(phrase)) {
        score += 3;
      }
      if (requirementLower.includes(phrase)) {
        score += 4; // Requirements are more relevant for answers
      }
    }
    
    // Look for individual word matches
    const questionWords = questionLower.split(/\s+/).filter(word => 
      word.length > 3 && !['what', 'when', 'where', 'which', 'how', 'does', 'your', 'our', 'with'].includes(word)
    );
    
    for (const word of questionWords) {
      if (descriptionLower.includes(word)) {
        score += 1;
      }
      if (requirementLower.includes(word)) {
        score += 2;
      }
    }
    
    return { ...item, relevanceScore: score };
  });
  
  // Filter items with non-zero scores and sort by relevance
  const relevantItems = scoredData
    .filter(item => item.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3); // Limit to top 3 most relevant items
  
  return relevantItems.map(item => {
    const { relevanceScore, ...rest } = item;
    return rest;
  });
}

// Extract meaningful phrases from the question
function extractKeyPhrases(question) {
  const phrases = [];
  
  // Common security/compliance phrases to look for
  const commonPhrases = [
    'data encryption', 'encrypt data', 'at rest', 'in transit',
    'access control', 'multi factor', 'two factor', 'authentication',
    'data retention', 'retain data', 'data deletion', 'delete data',
    'security audit', 'penetration test', 'vulnerability scan',
    'incident response', 'breach notification', 'data processing',
    'privacy policy', 'data protection', 'data transfer', 'cross border',
    'third party', 'vendor management', 'risk assessment',
    'security protocol', 'security policy', 'data classification',
    'data security', 'security controls', 'security measures'
  ];
  
  for (const phrase of commonPhrases) {
    if (question.includes(phrase)) {
      phrases.push(phrase);
    }
  }
  
  return phrases;
}

// Generate answer from the relevant data
function generateAnswer(question, relevantData) {
  if (relevantData.length === 0) {
    return 'Based on the available compliance information, we cannot provide a specific answer to your question. Please consult with our compliance officer for detailed information.';
  }

  // Extract the key topic from the question
  const questionLower = question.toLowerCase();
  let questionTopic = '';
  
  if (questionLower.includes('encrypt')) {
    questionTopic = 'encryption';
  } else if (questionLower.includes('access') || questionLower.includes('authentication')) {
    questionTopic = 'access control';
  } else if (questionLower.includes('retention') || questionLower.includes('store')) {
    questionTopic = 'data retention';
  } else if (questionLower.includes('third party') || questionLower.includes('vendor')) {
    questionTopic = 'third-party management';
  } else if (questionLower.includes('breach') || questionLower.includes('incident')) {
    questionTopic = 'incident response';
  }

  // Start with a direct answer to the question if possible
  let answer = '';
  
  // If the question is a yes/no question about a capability
  if (questionLower.startsWith('do you') || questionLower.startsWith('does your') || 
      questionLower.startsWith('can you') || questionLower.startsWith('are you')) {
    answer = 'Yes, ';
  }
  
  // Build the answer from relevant compliance data
  const sources = [];
  
  for (let i = 0; i < Math.min(relevantData.length, 3); i++) {
    const item = relevantData[i];
    let itemAnswer = '';
    
    if (item.requirement) {
      itemAnswer = condenseText(item.requirement, 150);
    } else if (item.description) {
      itemAnswer = condenseText(item.description, 150);
    }
    
    if (itemAnswer) {
      sources.push(`${item.name || 'Compliance Standard'}: ${itemAnswer}`);
    }
  }
  
  if (sources.length > 0) {
    answer += sources.join(' ');
  } else {
    answer = 'Based on our compliance framework, we maintain appropriate measures to address your concern. Please contact our compliance team for specific details.';
  }
  
  return answer;
}

function condenseText(text, maxLength) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  // Try to break at sentence boundaries
  const sentences = text.split(/[.!?]+/);
  let result = '';
  
  for (const sentence of sentences) {
    if ((result + sentence).length <= maxLength - 10) { // Leave some buffer
      result += sentence.trim() + '. ';
    } else {
      break;
    }
  }
  
  if (result.length === 0) {
    // If no complete sentences fit, truncate at word boundary
    const words = text.split(/\s+/);
    result = '';
    for (const word of words) {
      if ((result + word).length <= maxLength - 10) {
        result += word + ' ';
      } else {
        break;
      }
    }
    result = result.trim() + '...';
  }
  
  return result.trim();
} 