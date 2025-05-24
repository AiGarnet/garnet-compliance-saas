import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { UserService } from './services/userService';
import { WaitlistSignupRequest } from './types/user';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const userService = new UserService();

// Configure CORS with specific options
const corsOptions = {
  origin: ['https://testinggarnet.netlify.app', 'https://www.testinggarnet.netlify.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.use(express.json());

// Add CORS headers manually to ensure they're set
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers for all requests
  res.header('Access-Control-Allow-Origin', '*'); // Allow all origins
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// Load compliance data
// Check multiple possible paths for the data file
let complianceData: any[] = [];
const possiblePaths = [
  path.join(__dirname, '../../data_new.json'), // Original path
  path.join(__dirname, '../data_new.json'),    // One level up
  '/data_new.json',                           // Root directory
  './data_new.json',                          // Current directory
  path.join(__dirname, '/data_new.json'),     // In dist directory
];

let dataLoaded = false;
for (const dataPath of possiblePaths) {
  try {
    if (fs.existsSync(dataPath)) {
      const rawData = fs.readFileSync(dataPath, 'utf-8');
      complianceData = JSON.parse(rawData);
      console.log(`Loaded ${complianceData.length} compliance records from ${dataPath}`);
      dataLoaded = true;
      break;
    }
  } catch (error) {
    console.error(`Error loading compliance data from ${dataPath}:`, error);
  }
}

if (!dataLoaded) {
  console.error('Could not load compliance data from any location');
  // Create empty data if needed
  complianceData = [];
}

// Initialize OpenAI client with fallback
const openaiApiKey = process.env.OPENAI_API_KEY || '';
const openai = new OpenAI({
  apiKey: openaiApiKey,
});

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

// Waitlist signup endpoint
app.post('/api/waitlist/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, role, organization }: WaitlistSignupRequest = req.body;
    
    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, password, full_name, and role are required' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    
    // Create user
    const user = await userService.createUser({
      email,
      password,
      full_name,
      role,
      organization,
      metadata: {
        signup_source: 'landing_page',
        signup_date: new Date().toISOString()
      }
    });
    
    // Return success response (don't include password hash)
    const { password_hash, ...userResponse } = user;
    res.status(201).json({
      message: 'Successfully joined the waitlist!',
      user: userResponse
    });
    
  } catch (error: any) {
    console.error('Waitlist signup error:', error);
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get waitlist stats (admin endpoint)
app.get('/api/waitlist/stats', async (req: Request, res: Response) => {
  try {
    const stats = await userService.getWaitlistStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching waitlist stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all waitlist users (admin endpoint)
app.get('/api/waitlist/users', async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllWaitlistUsers();
    res.json({ users });
  } catch (error: any) {
    console.error('Error fetching waitlist users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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

// Generate answer using OpenAI with the new v4 API
async function generateAnswer(question: string, relevantData: any[]): Promise<string> {
  if (relevantData.length === 0) {
    return 'This information is not available in the current compliance dataset. Please consult the compliance officer.';
  }

  try {
    // Construct the prompt as specified in the requirements
    const systemPrompt = "You are a security and compliance assistant for SaaS vendors. Use the following reference information to answer the user's question accurately and concisely:";
    const contextData = JSON.stringify(relevantData, null, 2);
    const userPrompt = `${systemPrompt}\n\nReference Information:\n${contextData}\n\nQ: ${question}`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Reference Information:\n${contextData}\n\nQ: ${question}`
        }
      ],
      temperature: 0,
    });

    const answer = response.choices[0]?.message?.content || 
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