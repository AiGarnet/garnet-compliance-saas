import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
// @ts-ignore
import { Configuration, OpenAIApi } from 'openai';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Load compliance data
const dataPath = path.join(__dirname, '../../data_new.json');
let complianceData: any[] = [];

try {
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  complianceData = JSON.parse(rawData);
  console.log(`Loaded ${complianceData.length} compliance records`);
} catch (error) {
  console.error('Error loading compliance data:', error);
}

// Initialize OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the security questionnaire module API' });
});

app.get('/api/status', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    complianceRecords: complianceData.length 
  });
});

// Security questionnaire endpoint
app.post('/api/answer', async (req: Request, res: Response) => {
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

// Generate answer using OpenAI
async function generateAnswer(question: string, relevantData: any[]): Promise<string> {
  if (relevantData.length === 0) {
    return 'This information is not available in the current compliance dataset. Please consult the compliance officer.';
  }

  try {
    const context = JSON.stringify(relevantData);
    
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant for security questionnaires. Your job is to analyze questions related to enterprise security and compliance, then generate precise, professional, and verifiable answers strictly based on the provided context. 
          
Guidelines:
- DO NOT guess or fabricate information. Only use content from the provided context.
- USE exact phrases or language from policies whenever available.
- IF information is not found, say: 'This information is not available in the current compliance dataset. Please consult the compliance officer.'
- FORMAT answers in Markdown. Use bullet points for clarity when listing items.`
        },
        {
          role: "user",
          content: `Question: ${question}\n\nContext: ${context}`
        }
      ],
      temperature: 0,
    });

    const answer = response.data.choices[0]?.message?.content || 
      'This information is not available in the current compliance dataset. Please consult the compliance officer.';
    
    return answer;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return 'Error generating answer. Please consult the compliance officer.';
  }
}

// Ping route
app.get('/ping', (req: Request, res: Response) => {
  res.send('pong');
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});