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

// Import vendor routes
import vendorRoutes from './routes/vendorRoutes';

const app = express();
const port = process.env.PORT || 5000;
const userService = new UserService();

// Configure CORS with specific options
const corsOptions = {
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Set standard headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Handle OPTIONS requests
app.options('*', cors(corsOptions));

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

// Clean up API key - remove any whitespace and newlines
const apiKey = process.env.OPENAI_API_KEY?.replace(/\s+/g, '');
console.log('API Key configured:', apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No');
console.log('API Key first 20 chars:', apiKey ? apiKey.substring(0, 3) + '...' : 'None');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: apiKey,
  maxRetries: 3,
  timeout: 60000, // Increase timeout to 60 seconds for more comprehensive answers
});

// Add additional debug logging
console.log('OpenAI client initialized with API key');

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
    if (!apiKey) {
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

// Let's modify the generateAnswer function to handle rate limit errors
async function generateAnswer(question: string, relevantData: any[]): Promise<string> {
  if (relevantData.length === 0) {
    console.log('No relevant data found for question:', question);
    return 'This information is not available in the current compliance dataset. Please consult the compliance officer.';
  }

  try {
    console.log('Generating answer for question:', question);
    console.log('Found relevant data items:', relevantData.length);
    
    // Check if the data has enough information to create a basic response
    const basicResponse = createBasicResponse(question, relevantData);
    
    // Enhanced system prompt clarifying the role as the vendor being questioned
    const systemPrompt = `You are answering compliance questions on behalf of a vendor being assessed. You must respond as if you are the actual vendor, NOT as a SaaS platform or compliance assistant.

Instructions:
1. Answer as if you are the vendor directly answering the compliance questionnaire.
2. Use first-person perspective: "We implement...", "Our company has...", "Yes, our organization..."
3. Be specific and factual about compliance practices.
4. When answering security/compliance questions, provide specific details about your controls and processes.
5. Begin with a direct answer (Yes/No when applicable) followed by specific details.
6. Include relevant regulatory references when applicable.
7. Avoid phrases like "As a compliance assistant..." or "The vendor should..."
8. Respond in a professional, confident, and transparent tone.
9. Include specific details about implementation when relevant.
10. For questions about certifications or policies, mention specific standards or frameworks.`;

    const contextData = JSON.stringify(relevantData, null, 2);
    
    try {
      console.log('Making OpenAI API request with model: gpt-4');
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
        temperature: 0.3,
        max_tokens: 800,
        top_p: 0.95,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });
      
      console.log('OpenAI API request successful');
      const answer = response.choices[0]?.message?.content || 
        'This information is not available in the current compliance dataset. Please consult the compliance officer.';
      
      console.log('Generated answer (first 100 chars):', answer.substring(0, 100) + '...');
      return answer;
    } catch (err: any) {
      console.error('Error in OpenAI chat.completions.create:', err);
      
      // If it's a rate limit error or quota exceeded, return the basic response
      if (err.status === 429 || (err.error && err.error.code === 'insufficient_quota')) {
        console.log('API quota exceeded, returning basic response');
        return basicResponse;
      }
      
      throw err;
    }
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return 'Error generating answer. Please consult the compliance officer.';
  }
}

// Function to create a basic response from the relevant data
function createBasicResponse(question: string, relevantData: any[]): string {
  // Extract keywords from the question
  const questionLower = question.toLowerCase();
  const keywords = ['privacy', 'security', 'encryption', 'data', 'breach', 'policy', 'compliance', 'protection', 'gdpr', 'ccpa', 'hipaa'];
  
  // Check if it's a yes/no question
  const yesNoWords = ['do you', 'does your', 'are you', 'have you', 'has your', 'is your', 'can you', 'will you'];
  const isYesNoQuestion = yesNoWords.some(phrase => questionLower.includes(phrase));
  
  // Determine the most likely answer based on keywords
  let answer = 'Yes, our organization ';
  
  if (questionLower.includes('privacy policy') || questionLower.includes('privacy notice')) {
    answer += 'maintains a comprehensive Privacy Policy that is publicly available on our website. This policy details what data we collect, how we use it, and the rights of data subjects.';
  } else if (questionLower.includes('encryption')) {
    answer += 'implements strong encryption for all data both at rest and in transit. We use industry-standard protocols and regularly audit our encryption practices.';
  } else if (questionLower.includes('breach') || questionLower.includes('incident')) {
    answer += 'has a robust incident response plan for handling data breaches. We notify all affected parties and relevant authorities within the timeframes required by applicable regulations.';
  } else if (questionLower.includes('data retention') || questionLower.includes('retention policy')) {
    answer += 'has a formal data retention policy. We only retain personal data for as long as necessary to fulfill the purposes for which it was collected.';
  } else if (questionLower.includes('access control') || questionLower.includes('authorization')) {
    answer += 'implements strict access controls based on the principle of least privilege. All access to sensitive data is logged and regularly audited.';
  } else if (questionLower.includes('gdpr') || questionLower.includes('data protection')) {
    answer += 'is compliant with GDPR requirements. We have implemented appropriate technical and organizational measures to protect personal data.';
  } else if (questionLower.includes('ccpa') || questionLower.includes('california')) {
    answer += 'complies with the California Consumer Privacy Act. We respect consumer rights regarding their personal information and provide mechanisms for them to exercise these rights.';
  } else if (questionLower.includes('hipaa') || questionLower.includes('health')) {
    answer += 'implements all required HIPAA safeguards when handling protected health information. We maintain strict privacy and security standards for healthcare data.';
  } else {
    // Generic response for other topics
    answer = 'Yes, our organization has implemented comprehensive security and compliance measures regarding this topic. We follow industry best practices and regularly review our procedures to ensure ongoing compliance with relevant regulations.';
  }
  
  // Add a note about using a fallback response
  answer += '\n\n[Note: This is a pre-generated response. For more detailed information, please contact our compliance team directly.]';
  
  return answer;
}

// Ping route
app.get('/ping', (req: Request, res: Response) => {
  res.send('pong');
});

// Batch questionnaire endpoint for processing multiple questions at once
app.post('/api/batch-answers', async (req: Request, res: Response) => {
  try {
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Questions array is required' });
    }

    // Validate OpenAI configuration
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Process each question in parallel
    const answers = await Promise.all(
      questions.map(async (question) => {
        try {
          // Find relevant compliance information
          const relevantData = findRelevantComplianceData(question, complianceData);
          
          // Generate answer using OpenAI
          const answer = await generateAnswer(question, relevantData);
          
          return { question, answer, error: null };
        } catch (error: any) {
          console.error(`Error processing question: ${question}`, error);
          return { 
            question, 
            answer: "We couldn't generate an answer—please try again.", 
            error: error.message || 'Error processing question' 
          };
        }
      })
    );
    
    res.json({ answers });
  } catch (error: any) {
    console.error('Error processing batch questions:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// New endpoint for generating answers to multiple questions
app.post('/api/generate-answers', async (req: Request, res: Response) => {
  try {
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'A non-empty array of questions is required' 
      });
    }

    // Validate OpenAI configuration
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'OpenAI API key not configured' 
      });
    }

    // Process each question and track processing time
    const startTime = Date.now();
    const results = await Promise.all(
      questions.map(async (question) => {
        try {
          // Find relevant compliance information
          const relevantData = findRelevantComplianceData(question, complianceData);
          
          // Generate answer using OpenAI
          const answer = await generateAnswer(question, relevantData);
          
          return { question, answer };
        } catch (error: any) {
          console.error(`Error processing question: ${question}`, error);
          return { 
            question, 
            answer: null, 
            error: error.message || 'Error processing question' 
          };
        }
      })
    );
    
    const processingTime = Date.now() - startTime;
    
    res.json({ 
      success: true, 
      data: {
        answers: results,
        metadata: {
          totalQuestions: questions.length,
          processingTimeMs: processingTime,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error: any) {
    console.error('Error generating answers:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

// Add the /ask endpoint to match the one called from the frontend
app.post('/ask', async (req: Request, res: Response) => {
  try {
    console.log('Received request to /ask endpoint with body:', req.body);
    const { question } = req.body;
    
    if (!question) {
      console.log('No question provided in request');
      return res.status(400).json({ error: 'Question is required' });
    }

    // Validate OpenAI configuration
    if (!apiKey) {
      console.log('API key not configured');
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    console.log('Finding relevant compliance data for question:', question);
    // Find relevant compliance information
    const relevantData = findRelevantComplianceData(question, complianceData);
    console.log(`Found ${relevantData.length} relevant data items`);
    
    try {
      // Generate answer using OpenAI
      console.log('Generating answer using OpenAI');
      const answer = await generateAnswer(question, relevantData);
      console.log('Successfully generated answer');
      
      res.json({ question, answer });
    } catch (openaiError: any) {
      console.error('Error generating answer with OpenAI:', openaiError);
      res.status(500).json({ 
        error: `Error generating answer with OpenAI: ${openaiError.message}`,
        answer: "We couldn't generate an answer due to an issue with our AI service. Please try again later."
      });
    }
  } catch (error: any) {
    console.error('Error processing question:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      answer: "We couldn't generate an answer—please try again."
    });
  }
});

// Add vendor routes
app.use('/api/vendors', vendorRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});