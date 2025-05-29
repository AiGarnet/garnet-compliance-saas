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

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 60000, // Increase timeout to 60 seconds for more comprehensive answers
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
10. For questions about certifications or policies, mention specific standards or frameworks.

Example questions and answers:
Q: Does your organization have a published Privacy Policy?
A: Yes, our organization maintains a comprehensive Privacy Policy that is publicly available on our website. Our policy details what data we collect, how we use it, and the rights of data subjects. We regularly review and update it to reflect changes in regulations and our business practices. Our policy is compliant with GDPR, CCPA, and other applicable privacy regulations.

Q: Do you notify supervisory authorities and affected individuals within 72 hours of a data breach?
A: Yes, we notify supervisory authorities and affected individuals within 72 hours of becoming aware of a data breach, as required by GDPR Article 33. Our incident response team assesses breach impact, prepares documentation, and handles all notifications within the statutory timeframe. We conduct regular breach simulation exercises to ensure our team is prepared to respond efficiently.

Q: Is personal data encrypted at rest and in transit?
A: Yes, we encrypt all personal data both at rest and in transit. Our organization uses industry-standard encryption protocols (AES-256 for data at rest and TLS 1.2+ for data in transit). Our encryption key management follows NIST guidelines, with regular rotation and secure storage of encryption keys. We verify our encryption implementation through regular security audits and penetration testing.

Q: Have you appointed a Data Protection Officer (DPO)? If yes, provide details.
A: Yes, our organization has appointed a qualified Data Protection Officer who oversees our data protection strategy and implementation. Our DPO has expertise in data protection law and practices, and is responsible for monitoring compliance, advising on Data Protection Impact Assessments, and serving as a contact point for data subjects and supervisory authorities. The DPO reports directly to our executive leadership to ensure independence in their function.`;

    const contextData = JSON.stringify(relevantData, null, 2);
    
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
      temperature: 0.3, // Slightly increased for better articulation while maintaining accuracy
      max_tokens: 800, // Allow for more comprehensive answers
      top_p: 0.95, // Slightly higher nucleus sampling for more natural language
      presence_penalty: 0.1, // Slight penalty to reduce repetition
      frequency_penalty: 0.1, // Slight penalty to encourage diverse phrasing
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

// Batch questionnaire endpoint for processing multiple questions at once
app.post('/api/batch-answers', async (req: Request, res: Response) => {
  try {
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Questions array is required' });
    }

    // Validate OpenAI configuration
    if (!process.env.OPENAI_API_KEY) {
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

// Add the /ask endpoint to match the one called from the frontend
app.post('/ask', async (req: Request, res: Response) => {
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
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      answer: "We couldn't generate an answer—please try again."
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});