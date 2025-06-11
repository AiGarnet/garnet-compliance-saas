import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { UserService } from './services/userService';
import { WaitlistService } from './services/waitlistService';
import { WaitlistSignupRequest } from './types/user';
import http from 'http';
import vendorRoutes from './routes/vendorRoutes';
import questionnaireRoutes from './routes/questionnaireRoutes';
import systemRoutes from './routes/systemRoutes';
import waitlistRoutes from './routes/waitlistRoutes';

// Load environment variables
dotenv.config();

const app = express();
// Update port configuration to use environment variable with fallback
const PORT = process.env.PORT || 8080;
console.log(`Configured to use PORT: ${PORT}`);
const userService = new UserService();
const waitlistService = new WaitlistService();

// Configure CORS with specific options
const corsOptions = {
  origin: [
    'https://testinggarnet.netlify.app',
    'https://garnetai.net',
    /\.netlify\.app$/,  // Allow any Netlify subdomain
    /\.garnetai\.net$/  // Allow any garnetai.net subdomain
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: false
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Request logging middleware for debugging
app.use((req: Request, res: Response, next: Function) => {
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Handle CORS preflight requests properly
app.options('*', cors(corsOptions));

// Register API routes
app.use('/api/vendors', vendorRoutes);

// Enhanced logging for questionnaire routes
app.use('/api/questionnaires', (req: Request, res: Response, next: Function) => {
  console.log(`🔍 Questionnaire route accessed: ${req.method} ${req.originalUrl}`);
  next();
});
app.use('/api/questionnaires', questionnaireRoutes);

// Register system routes (health, ping, AI endpoints)
app.use('/', systemRoutes);
app.use('/api', systemRoutes);

// Register waitlist routes
app.use('/', waitlistRoutes);
app.use('/api', waitlistRoutes);

// Debug endpoint to test questionnaire functionality
app.get('/test-questionnaires', async (req: Request, res: Response) => {
  try {
    console.log('🧪 Testing questionnaire functionality...');
    
    // Import and test the repository directly
    const { QuestionnaireRepository } = await import('./db/questionnaireRepository');
    const repo = new QuestionnaireRepository();
    
    // Test database connection
    const questionnaires = await repo.getAllQuestionnaires();
    
    res.json({
      success: true,
      message: 'Questionnaire system is working',
      questionnairesCount: questionnaires.length,
      questionnaires: questionnaires.slice(0, 3), // Return first 3 for testing
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Questionnaire test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Global error handling middleware
app.use((err: any, req: Request, res: Response, next: Function) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Error handler for 404 Not Found
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Load compliance data with more robust path resolution
let complianceData: any[] = [];

// Define possible paths for the data file in different environments
const possiblePaths = [
  path.join(__dirname, '../../data_new.json'),  // Development path
  path.join(__dirname, '../data_new.json'),     // Production build path
  path.join(process.cwd(), 'data_new.json'),    // Docker container root
  '/app/data_new.json'                          // Common Docker workdir path
];

// Try to load the data from any of the possible paths
let dataLoaded = false;
for (const dataPath of possiblePaths) {
  try {
    console.log(`Attempting to load data from: ${dataPath}`);
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  complianceData = JSON.parse(rawData);
    console.log(`Successfully loaded ${complianceData.length} compliance records from ${dataPath}`);
    dataLoaded = true;
    break;
} catch (error) {
    console.log(`Could not load data from ${dataPath}`);
  }
}

if (!dataLoaded) {
  console.error('Error: Could not load compliance data from any of the expected locations');
  // Initialize with empty array to prevent application crash
  complianceData = [];
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Routes
app.get('/', (req: Request, res: Response) => {
  // Provide a useful API documentation response
  res.status(200).json({ 
    status: 'ok',
    service: 'GarnetAI Compliance Backend API',
    version: '1.0.1',
    endpoints: {
      '/': 'API documentation (this response)',
      '/ask': 'POST - Submit a question to the AI chatbot',
      '/api/answer': 'POST - Submit a question to get compliance answers',
      '/api/generate-answers': 'POST - Generate answers for multiple questions in batch',
      '/join-waitlist': 'POST - Join the waitlist (simple signup)',
      '/api/waitlist/signup': 'POST - Join waitlist with password',
      '/api/waitlist/stats': 'GET - Get waitlist statistics',
      '/api/waitlist/users': 'GET - Get all waitlist entries',
      '/api/auth/signup': 'POST - User signup with authentication',
      '/api/auth/login': 'POST - User login',
      'GET /api/vendors': 'Get all vendors',
      'GET /api/vendors/:id': 'Get vendor by ID',
      'POST /api/vendors': 'Create new vendor',
      'PUT /api/vendors/:id': 'Update vendor',
      'DELETE /api/vendors/:id': 'Delete vendor',
      'POST /api/vendors/:id/answers': 'Save questionnaire answers for vendor',
      'GET /api/vendors/stats': 'Get vendor statistics',
      'GET /api/vendors/status/:status': 'Get vendors by status',
      'GET /api/questionnaires': 'Get all questionnaires',
      'GET /api/questionnaires/:id': 'Get questionnaire by ID',
      'POST /api/questionnaires': 'Create new questionnaire',
      'PUT /api/questionnaires/:id': 'Update questionnaire',
      'DELETE /api/questionnaires/:id': 'Delete questionnaire',
      'GET /api/questionnaires/:id/questions': 'Get questionnaire questions',
      'PUT /api/questionnaires/:id/questions/:questionId': 'Update questionnaire question',
      '/health': 'GET - Health check endpoint',
      '/ping': 'GET - Simple ping-pong response',
      '/version': 'GET - Get API version information'
    },
    documentation: 'For more information, please refer to the API documentation',
    frontend: 'https://testinggarnet.netlify.app/'
  });
});

app.get('/status', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date(),
    complianceRecords: complianceData.length 
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'GarnetAI Backend API is healthy',
    timestamp: new Date().toISOString(),
    service: 'GarnetAI Compliance Backend',
    version: '1.0.0'
  });
});

// Simple ping endpoint  
app.get('/ping', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// Simple questionnaire test endpoint
app.get('/test-simple', (req: Request, res: Response) => {
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

// Test questionnaires endpoint
app.get('/test-questionnaires', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Questionnaire API is functional',
    timestamp: new Date().toISOString(),
    status: 'operational',
    endpoints: {
      'GET /api/questionnaires': 'Get all questionnaires',
      'POST /api/questionnaires': 'Create new questionnaire',
      'GET /api/questionnaires/:id': 'Get questionnaire by ID',
      'PUT /api/questionnaires/:id': 'Update questionnaire',
      'DELETE /api/questionnaires/:id': 'Delete questionnaire',
      'GET /api/questionnaires/:id/questions': 'Get questionnaire questions',
      'PUT /api/questionnaires/:id/questions/:questionId': 'Update question'
    }
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

// Simple waitlist signup endpoint (for Netlify function compatibility)
app.post('/join-waitlist', async (req: Request, res: Response) => {
  console.log('Received waitlist request at:', new Date().toISOString());
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  
  try {
    const { email, full_name, role, organization } = req.body;
    
    // Validate required fields
    if (!email || !full_name) {
      console.error('Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields: email and full_name are required' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Invalid email format:', email);
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    console.log('Adding to waitlist table...');
    
    // Add to waitlist using the service
    const waitlistEntry = await waitlistService.addToWaitlist({
      name: full_name,
      email: email,
      role: role || null,
      organization: organization || null
    });
    
    console.log('Successfully added to waitlist:', waitlistEntry);
    
    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Successfully joined the waitlist!',
      data: waitlistEntry
    });
    
  } catch (error: any) {
    console.error('Error in join-waitlist endpoint:', error);
    
    // Check for duplicate email
    if (error.message === 'Email already exists in waitlist') {
      return res.status(409).json({ 
        success: false,
        error: 'Email already registered in waitlist'
      });
    }
    
    // General error
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Authentication signup endpoint
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, role, organization, source }: WaitlistSignupRequest = req.body;
    
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
    
    // Validate role
    if (!['vendor', 'enterprise'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either "vendor" or "enterprise"' });
    }
    
    // Create authenticated user
    const user = await userService.createWaitlistUser({
      email,
      password,
      full_name,
      role,
      organization,
      source: source || 'auth_signup',
      metadata: {
        signup_source: source || 'auth_signup',
        signup_date: new Date().toISOString(),
        is_authenticated: true
      }
    });
    
    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'garnet-ai-super-secret-jwt-key-2025-production';
    
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return success response (don't include password hash)
    const { password_hash, ...userResponse } = user;
    res.status(201).json({
      message: 'Successfully signed up!',
      token,
      user: userResponse
    });
    
  } catch (error: any) {
    console.error('Auth signup error:', error);
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Authentication login endpoint
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Find user by email and verify password
    const user = await userService.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Check if password exists (user might be from waitlist without password)
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Account not set up for login. Please sign up again.' });
    }
    
    // Verify password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'garnet-ai-super-secret-jwt-key-2025-production';
    
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return success response (don't include password hash)
    const { password_hash, ...userResponse } = user;
    res.status(200).json({
      message: 'Login successful',
      token,
      user: userResponse
    });
    
  } catch (error: any) {
    console.error('Auth login error:', error);
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

// Add a compatible /ask endpoint for frontend integration
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
    
    // Return just the answer field as expected by the frontend
    res.json({ answer });
  } catch (error: any) {
    console.error('Error processing question:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Batch answer generation endpoint
app.post('/api/generate-answers', async (req: Request, res: Response) => {
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

// Helper function to detect vendor-directed questions
function isVendorDirectedQuestion(question: string): boolean {
  const vendorPhrases = [
    // Original phrases
    'how does your company',
    'do you have',
    'are you compliant with',
    'how is your data handled',
    'what measures do you follow',
    'how do you ensure',
    'does your organization',
    'can you provide',
    'what steps do you take',
    'how do you manage',
    'what policies do you have',
    'how do you handle',
    'are you certified',
    'do you maintain',
    'what security measures',
    'how do you protect',
    'do you comply with',
    'what compliance frameworks',
    'are any directors',
    'are any owners',
    'are any employees',
    
    // Added phrases from the question list
    'privacy policy',
    'data processing agreements',
    'appointed a data protection officer',
    'personal data encrypted',
    'access control',
    'data subject access requests',
    'data retention',
    'data deletion',
    'notify supervisory authorities',
    'consent collected',
    'cross-border data transfer',
    'internal audits',
    'country risk matrix',
    'beneficial ownership',
    'storing or processing personal data',
    'documented legal basis',
    'appointed local representatives',
    'incident response plan',
    'cybersecurity awareness training',
    'vulnerability assessments',
    'report data breaches',
    'enforcement action',
    'directors currently under investigation',
    'anti-boycott laws',
    'ultimate beneficial owners',
    'enhanced due diligence',
    'know your business',
    'transaction monitoring',
    'aml/cft compliance',
    'screened against',
    'linked to a pep',
    'negative news search',
    'sanctions compliance',
    'anti-bribery',
    'government officials',
    'training program',
    'code of conduct',
    'ethics policy',
    'third-party risk assessments',
    'sanctions screening',
    'iso 27001',
    'soc 2',
    'information security policy',
    'business continuity',
    'disaster recovery',
    'audit logs',
    'mas aml/cft',
    'gdpr article 30',
    'thailand pdpa',
    'pdp commissioner',
    'ccpa',
    'fatf-listed',
    'red flags',
    'non-compliance',
    'litigation',
    'multi-factor authentication',
    'access review',
    'security incidents',
    'third-party security audit',
    'sub-processors',
    'corporate registry',
    'verified via government',
    'trust-based',
    'nominee directors',
    'dual-use export',
    'ownership tracing',
    'embargoed territories',
    'delisted from a sanctions list',
    'ip addresses',
    'facilitation payments',
    'corruption risk assessment',
    'whistleblower hotline',
    'third-party agents',
    'sub-vendors',
    'attestation of aml/ctf',
    'mas aml/cft notice 626',
    'soc 2 type ii',
    'risk-based scoring',
    'compliance monitoring tool',
    'data processors',
    'sub-processors',
    'data protection impact assessment',
    'nric',
    'national id numbers',
    'data subject requests',
    'privacy governance',
    
    // Additional phrases from research document
    'what categories of personal data',
    'what is the purpose of collection',
    'what is the legal basis for processing',
    'what are the data retention periods',
    'where is data stored',
    'is consent explicit',
    'is it opt-in or opt-out',
    'is there a clear mechanism for withdrawal',
    'how are dsars handled',
    'what is the process for data access',
    'what are the timelines for responding',
    'does the vendor\'s system embed privacy',
    'are the highest privacy settings enabled',
    'what is the vendor\'s incident response plan',
    'what are the data breach notification timelines',
    'has a dpo been appointed',
    'what are the dpo\'s responsibilities',
    'are dpas signed',
    'do dpas include required clauses',
    'is the vendor on global sanctions lists',
    'are any directors/ubos peps',
    'has a negative news search been performed',
    'have all ubos been identified',
    'have ubos been verified',
    'do any ubos own',
    'what is the nationality',
    'has ownership tracing been conducted',
    'has the vendor been classified as',
    'does the vendor operate in a fatf-listed',
    'was edd conducted',
    'is transaction monitoring in place',
    'does the vendor maintain aml/cft compliance records',
    'is the vendor required to report suspicious transactions',
    'have you reviewed the vendor\'s code of conduct',
    'are facilitation payments explicitly prohibited',
    'has the vendor conducted a corruption risk assessment',
    'is there a whistleblower hotline',
    'are third-party agents used',
    'does the vendor require its sub-vendors',
    'what is the vendor\'s business continuity posture',
    'are there historical instances of non-compliance',
    'have you identified any red flags',
    'are all compliance requirements explicitly included',
    'are audit rights clearly defined',
    'are non-compliance penalties outlined',
    'has the vendor provided a documented risk-based scoring model',
    'is personal data encrypted',
    'is there a formal internal access review process',
    'are security incidents reported to customers',
    'are e-signatures valid',
    'what are the requirements for cross-border data transfers'
  ];
  
  const questionLower = question.toLowerCase();
  return vendorPhrases.some(phrase => questionLower.includes(phrase));
}

// Generate answer using OpenAI with the new v4 API
async function generateAnswer(question: string, relevantData: any[]): Promise<string> {
  // Default response if no relevant data found
  if (relevantData.length === 0 && !isVendorDirectedQuestion(question)) {
    return 'This information is not available in the current compliance dataset. Please consult the compliance officer.';
  }

  try {
    // Detect if this is a vendor-directed question
    const isVendorQuestion = isVendorDirectedQuestion(question);
    const contextData = JSON.stringify(relevantData, null, 2);
    
    let systemPrompt;
    let userContent;
    let temperature = 0;
    
    if (isVendorQuestion) {
      // Enhanced vendor-impersonation prompt with comprehensive regulatory knowledge
      systemPrompt = `You are answering as a SaaS vendor called GarnetAI that follows GDPR, ISO 27001, SOC 2 Type II, and other global regulatory frameworks including European, American, and Southeast Asian regulations. Your company implements comprehensive security and compliance measures based on industry best practices.

Your company profile is as follows:
- You have a published Privacy Policy that is regularly updated and available on your website
- You sign Data Processing Agreements (DPAs) with all sub-processors
- You have appointed a Data Protection Officer (DPO) who oversees privacy compliance
- All personal data is encrypted both at rest and in transit using industry-standard encryption
- You implement role-based access controls for all sensitive data
- You have a formal process for handling data subject access requests (DSARs)
- Your data retention policy follows a "minimum necessary" approach
- You notify authorities of data breaches within required timeframes (typically 72 hours)
- You collect and document consent before processing personal data
- You comply with cross-border data transfer mechanisms using Standard Contractual Clauses (SCCs)
- You conduct regular internal audits for financial crime risk
- You maintain a comprehensive country risk matrix aligned with FATF guidelines
- You conduct enhanced due diligence for high-risk relationships
- You update beneficial ownership records promptly when changes occur
- You have robust incident response plans aligned with ISO 27035
- You provide regular security awareness training to all staff
- You use third-party security firms for independent vulnerability assessments
- None of your directors are currently under investigation or government officials
- You maintain audit logs for all compliance-related activities
- You support multi-factor authentication (MFA) for all users
- You have formal access review processes
- You report security incidents to customers according to contractual SLAs
- You review all sub-processors for compliance before onboarding
- You have a company-wide anti-bribery training program that is regularly updated
- You explicitly prohibit facilitation payments in your code of conduct
- You have a whistleblower hotline that is anonymous and globally available
- You require sub-vendors to sign binding anti-corruption clauses
- You maintain AML/CFT compliance records for at least 5 years
- You have a comprehensive Business Continuity and Disaster Recovery Plan

You are an expert in global compliance regulations with deep knowledge of:

DATA PRIVACY: You understand that while GDPR is influential, regional variations exist. You know that the EU and UK GDPR require 72-hour breach notifications, CCPA/CPRA applies to businesses with $25M+ revenue or 100,000+ consumers, PIPEDA requires "real risk of significant harm" breach reporting, Australia's Privacy Act has 13 APPs with a 30-day breach assessment period, New Zealand requires breach reports "promptly", Brazil's LGPD requires notification within 3 business days, and Asian laws have varying timelines (Singapore 3 days, Thailand 72 hours, Malaysia 72 hours, China 24 hours for national security impacts).

FINANCIAL CRIME: You know beneficial ownership thresholds vary (typically 25%, but 10% in India, 5% in Colombia), public BO registers exist in the UK, EU member states, and are coming to Canada and China, but not Australia/South Korea. You understand that PEPs require Enhanced Due Diligence, and SAR/STR reporting timelines vary by jurisdiction (US 30-60 days, Brazil 24 hours, UK "as soon as practicable").

ANTI-BRIBERY: You're familiar with the FCPA's prohibition on bribing foreign officials and its accounting provisions, the UK Bribery Act's "failure to prevent bribery" corporate offense and "adequate procedures" defense, and that most modern laws prohibit facilitation payments (except the narrow FCPA exception).

CYBERSECURITY: You understand key frameworks like ISO 27001, SOC 2, NIST CSF, and the EU's NIS2 Directive, along with varying breach notification requirements and the importance of MFA, access controls, and vulnerability management.

E-SIGNATURES: You know that while e-signatures are generally valid in 180+ countries, there are variations (EU eIDAS has Simple, Advanced, and Qualified signatures) and exceptions for certain documents (wills, real estate, etc.).

CROSS-BORDER DATA: You're aware of adequacy decisions, SCCs, BCRs, and contractual safeguards for international transfers, and data localization requirements in certain jurisdictions like China.

When answering, speak as the vendor ("we", "our company", "our organization") and provide specific, confident responses about your compliance practices. Draw from both the company profile above, your regulatory knowledge, and the compliance framework information provided to demonstrate how you meet various regulatory requirements. Tailor your answer to the specific jurisdiction if mentioned in the question.

Use the following compliance information as additional context for your answers:`;
      
      userContent = `Reference Information:\n${contextData}\n\nAnswer the following question from a prospective enterprise client, as if you are the vendor:\n\nQ: ${question}\nA:`;
      temperature = 0.5;
    } else {
      // Generic assistant prompt
      systemPrompt = "You are a security and compliance assistant for SaaS vendors. Use the following reference information to answer the user's question accurately and concisely. Provide helpful guidance about compliance frameworks and security best practices.";
      
      userContent = `Reference Information:\n${contextData}\n\nQ: ${question}`;
      temperature = 0.4;
    }
    
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
          content: userContent
        }
      ],
      temperature: temperature,
    });

      const answer = response.choices[0]?.message?.content || 
        'This information is not available in the current compliance dataset. Please consult the compliance officer.';
      
      return answer;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return 'Error generating answer. Please consult the compliance officer.';
  }
}

// Specific healthcheck endpoint for Railway
app.get('/railway-healthcheck', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Health and version endpoints
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy' });
});

app.get('/version', (req: Request, res: Response) => {
  res.status(200).json({ 
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Ping route
app.get('/ping', (req: Request, res: Response) => {
  res.send('pong');
});

// Create HTTP server with proper timeout
const server = http.createServer(app);

// Set server timeout to prevent hanging connections
server.timeout = 30000; // 30 seconds

// Add proper signal handling for graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Start server - use PORT environment variable
server.listen(Number(PORT), '::', () => {
  console.log(`Server running on port ${PORT} and listening on IPv6`);
});