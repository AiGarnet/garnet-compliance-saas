import express, { Request, Response } from 'express';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Load compliance data
let complianceData: any[] = [];
try {
  const dataPath = path.join(__dirname, '../../data_new.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  complianceData = JSON.parse(rawData);
  console.log(`Loaded ${complianceData.length} compliance records`);
} catch (error) {
  console.error('Error loading compliance data:', error);
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'GarnetAI Backend API is healthy',
    timestamp: new Date().toISOString(),
    service: 'GarnetAI Compliance Backend',
    version: '1.0.0'
  });
});

// Ping endpoint
router.get('/ping', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// Railway health check
router.get('/railway-healthcheck', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Version endpoint
router.get('/version', (req: Request, res: Response) => {
  res.status(200).json({ 
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Test simple endpoint
router.get('/test-simple', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Questionnaire routes are accessible',
    timestamp: new Date().toISOString(),
    routes: [
      'GET /api/questionnaires',
      'POST /api/questionnaires', 
      'GET /api/questionnaires/:id',
      'PUT /api/questionnaires/:id',
      'DELETE /api/questionnaires/:id'
    ]
  });
});

// AI Answer endpoint
router.post('/answer', async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Validate OpenAI configuration
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Find relevant compliance information
    const relevantData = findRelevantComplianceData(question, complianceData);
    
    // Generate answer using OpenAI
    const answer = await generateAnswer(question, relevantData);
    
    res.json({ question, answer });
  } catch (error: any) {
    console.error('Error processing question:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Ask endpoint (compatible with frontend)
router.post('/ask', async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Validate OpenAI configuration
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Find relevant compliance information
    const relevantData = findRelevantComplianceData(question, complianceData);
    
    // Generate answer using OpenAI
    const answer = await generateAnswer(question, relevantData);
    
    // Return just the answer field as expected by the frontend
    res.json({ answer });
  } catch (error: any) {
    console.error('Error processing question:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Batch answer generation endpoint
router.post('/generate-answers', async (req: Request, res: Response) => {
  try {
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Questions array is required and cannot be empty' });
    }

    // Validate OpenAI configuration
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const startTime = Date.now();
    const results: Array<{
      question: string;
      answer: string;
      success: boolean;
      error?: string;
    }> = [];
    let successfulAnswers = 0;
    let failedAnswers = 0;

    // Process questions in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (question: string) => {
        try {
          // Find relevant compliance information
          const relevantData = findRelevantComplianceData(question, complianceData);
          
          // Generate answer using OpenAI
          const answer = await generateAnswer(question, relevantData);
          
          successfulAnswers++;
          return {
            question,
            answer,
            success: true
          };
        } catch (error: any) {
          console.error(`Error generating answer for question: "${question}"`, error);
          failedAnswers++;
          return {
            question,
            answer: 'We couldn\'t generate an answer—please try again.',
            success: false,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process settled promises and extract values
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          failedAnswers++;
          results.push({
            question: 'Unknown question',
            answer: 'We couldn\'t generate an answer—please try again.',
            success: false,
            error: result.reason?.message || 'Unknown error'
          });
        }
      });
    }

    const processingTimeMs = Date.now() - startTime;

    res.json({
      answers: results,
      metadata: {
        totalQuestions: questions.length,
        successfulAnswers,
        failedAnswers,
        processingTimeMs,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error in batch answer generation:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Helper function to find relevant compliance data
function findRelevantComplianceData(question: string, data: any[]): any[] {
  // Convert question to lowercase for case-insensitive matching
  const questionLower = question.toLowerCase();
  
  // Define common categories and domains to look for
  const categories = [
    'Data Privacy', 'Data Security', 'Cybersecurity', 'Compliance', 
    'Financial Privacy', 'Public Sector Privacy', 'GDPR', 'HIPAA', 'CCPA'
  ];
  
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
    
    // Look for specific keyword matches in description
    const descriptionLower = item.description.toLowerCase();
    const questionWords = questionLower.split(/\s+/).filter(word => word.length > 3);
    
    for (const word of questionWords) {
      if (descriptionLower.includes(word)) {
        score += 1;
      }
    }
    
    return { ...item, relevanceScore: score };
  });
  
  // Filter items with non-zero scores and sort by relevance
  const relevantItems = scoredData
    .filter(item => item.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5); // Limit to top 5 most relevant items
  
  return relevantItems.map(item => {
    const { relevanceScore, ...rest } = item;
    return rest;
  });
}

// Helper function to generate AI answers
async function generateAnswer(question: string, relevantData: any[]): Promise<string> {
  try {
    // Prepare context from relevant compliance data
    let context = "You are a compliance expert. Use the following compliance information to answer the question:\n\n";
    
    if (relevantData.length > 0) {
      relevantData.forEach((item, index) => {
        context += `${index + 1}. ${item.name} (${item.jurisdiction || 'Global'}):\n`;
        context += `   Category: ${item.category}\n`;
        context += `   Description: ${item.description}\n`;
        if (item.domains && item.domains.length > 0) {
          context += `   Applicable Domains: ${item.domains.join(', ')}\n`;
        }
        context += "\n";
      });
    } else {
      context += "No specific compliance data found for this question. Provide a general compliance answer based on best practices.\n\n";
    }
    
    context += `Question: ${question}\n\nPlease provide a comprehensive compliance answer:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a compliance expert specializing in data privacy, cybersecurity, and regulatory requirements. Provide accurate, practical advice while recommending consultation with legal experts for specific implementation details."
        },
        {
          role: "user",
          content: context
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate an answer at this time. Please try again or contact support.';
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate AI response');
  }
}

export default router; 