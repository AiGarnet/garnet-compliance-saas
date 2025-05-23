import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Load the compliance data
let complianceData: any[] = [];
try {
  // Path is relative to the public directory
  const dataPath = path.join(process.cwd(), 'public', 'data_new.json');
  
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

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();
    
    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Find relevant data based on the question
    const relevantData = findRelevantComplianceData(question, complianceData);
    
    // Generate answer from the relevant data
    const answer = generateAnswer(question, relevantData);
    
    return NextResponse.json({ 
      question, 
      answer,
      timestamp: new Date().toISOString() 
    });
    
  } catch (error: any) {
    console.error('Error processing question:', error);
    return NextResponse.json(
      { error: error.message || 'Error processing your question' },
      { status: 500 }
    );
  }
}

// Helper function to find relevant compliance data
function findRelevantComplianceData(question: string, data: any[]): any[] {
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
    .slice(0, 3); // Limit to top 3 most relevant items instead of 5
  
  return relevantItems.map(item => {
    const { relevanceScore, ...rest } = item;
    return rest;
  });
}

// Extract meaningful phrases from the question
function extractKeyPhrases(question: string): string[] {
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
function generateAnswer(question: string, relevantData: any[]): string {
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
    // Assume yes if we have relevant data
    answer = `Yes. `;
  }

  // Add a concise summary based on the most relevant item
  const mostRelevant = relevantData[0];
  if (mostRelevant) {
    // Extract a key sentence from the requirement if available
    const requirement = mostRelevant.requirement || '';
    const mainPoints = extractMainPoints(requirement);
    
    if (mainPoints.length > 0) {
      answer += `${mainPoints.join(' ')} `;
    } else {
      // Fallback to a summary of the description
      answer += `Our compliance with ${mostRelevant.name} addresses this through our ${questionTopic || 'security'} controls. `;
    }
  }

  // Add specific compliance frameworks we adhere to
  answer += `\n\nRelevant compliance frameworks:\n\n`;
  
  // Only include the most pertinent details from each framework
  relevantData.forEach(item => {
    answer += `**${item.name}**\n`;
    
    // Add a concise summary rather than full description
    const description = item.description || '';
    const condensedDesc = condenseText(description, 150);
    answer += `Description: ${condensedDesc}\n`;
    
    // Format requirements as bullet points for readability
    if (item.requirement) {
      answer += `Requirements: ${item.requirement}\n`;
    }
    
    answer += `\n`;
  });
  
  // Add a concise closing statement
  answer += `For further details or implementation specifics, please contact our compliance team.`;
  
  return answer;
}

// Helper function to extract main points from text
function extractMainPoints(text: string): string[] {
  if (!text) return [];
  
  // Split by common separators
  const sentences = text.split(/[.;]\s+/);
  
  // Return first 1-2 sentences that are not too long
  return sentences
    .filter(s => s.length > 10 && s.length < 120)
    .slice(0, 2);
}

// Helper function to condense text
function condenseText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  
  // Find a suitable cutoff point
  const cutoff = text.lastIndexOf(' ', maxLength - 3);
  return text.substring(0, cutoff) + '...';
} 