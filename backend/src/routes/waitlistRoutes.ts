import express, { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { WaitlistService } from '../services/waitlistService';
import { WaitlistSignupRequest } from '../types/user';

const router = express.Router();
const userService = new UserService();
const waitlistService = new WaitlistService();

// Root endpoint with API documentation
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok',
    service: 'GarnetAI Compliance Backend API',
    version: '1.0.1',
    endpoints: {
      '/': 'API documentation',
      '/health': 'Health check',
      '/ping': 'Ping endpoint',
      '/join-waitlist': 'POST - Join the waitlist',
      '/api/waitlist/signup': 'POST - Join waitlist with password',
      '/api/waitlist/stats': 'GET - Get waitlist statistics',
      '/api/waitlist/users': 'GET - Get all waitlist entries',
      '/api/auth/signup': 'POST - User signup with authentication',
      '/api/vendors': 'Vendor management',
      '/api/questionnaires': 'Questionnaire management',
      '/ask': 'POST - AI chatbot',
      '/api/answer': 'POST - Compliance answers',
      '/api/generate-answers': 'POST - Batch answer generation'
    },
    documentation: 'For more information, please refer to the API documentation',
    frontend: 'https://testinggarnet.netlify.app/'
  });
});

// Simple waitlist signup endpoint (for Netlify function compatibility)
router.post('/join-waitlist', async (req: Request, res: Response) => {
  console.log('Received waitlist request at:', new Date().toISOString());
  console.log('Request body:', req.body);
  
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

// Waitlist signup endpoint with password
router.post('/waitlist/signup', async (req: Request, res: Response) => {
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
router.get('/waitlist/stats', async (req: Request, res: Response) => {
  try {
    const stats = await userService.getWaitlistStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching waitlist stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all waitlist users (admin endpoint)
router.get('/waitlist/users', async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllWaitlistUsers();
    res.json({ users });
  } catch (error: any) {
    console.error('Error fetching waitlist users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Authentication signup endpoint
router.post('/auth/signup', async (req: Request, res: Response) => {
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
    
    // Return success response (don't include password hash)
    const { password_hash, ...userResponse } = user;
    res.status(201).json({
      message: 'Account created successfully!',
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

export default router; 