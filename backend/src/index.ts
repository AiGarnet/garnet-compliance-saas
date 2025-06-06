import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { UserService } from './services/userService';
import { WaitlistService, CreateWaitlistEntryRequest } from './services/waitlistService';
import { WaitlistSignupRequest } from './types/user';

// Load environment variables
dotenv.config();

// Import vendor routes
import vendorRoutes from './routes/vendorRoutes';

const app = express();
const port = process.env.PORT || 5000;

// Initialize services
const userService = new UserService();
const waitlistService = new WaitlistService();

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

// Add debug logging for API key
console.log('Raw OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
console.log('Cleaned API key length:', apiKey?.length || 0);
console.log('API key starts with sk-:', apiKey?.startsWith('sk-') || false);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: apiKey,
  maxRetries: 3,
  timeout: 60000, // Increase timeout to 60 seconds for more comprehensive answers
});

// Add additional debug logging
console.log('OpenAI client initialized with API key');

// Test OpenAI connection on startup
if (apiKey) {
  console.log('Testing OpenAI connection...');
  openai.models.list()
    .then(() => {
      console.log('✅ OpenAI connection successful');
    })
    .catch((error) => {
      console.error('❌ OpenAI connection failed:', error.message);
    });
} else {
  console.error('❌ No OpenAI API key provided');
}

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
    const { email, password, full_name, role, organization, source }: WaitlistSignupRequest = req.body;
    
    // Validate required fields
    if (!email || !full_name) {
      return res.status(400).json({ 
        error: 'Missing required fields: email and full_name are required' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate password strength if provided
    if (password && password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    
    // Create waitlist user
    const user = await userService.createWaitlistUser({
      email,
      password,
      full_name,
      role: role || 'User',
      organization,
      source: source || 'landing_page',
      metadata: {
        signup_source: source || 'landing_page',
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
    const stats = await waitlistService.getWaitlistStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching waitlist stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all waitlist users (admin endpoint)
app.get('/api/waitlist/users', async (req: Request, res: Response) => {
  try {
    const entries = await waitlistService.getAllWaitlistEntries();
    res.json({ entries });
  } catch (error: any) {
    console.error('Error fetching waitlist entries:', error);
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
    
    // Enhanced system prompt for comprehensive and detailed responses
    const systemPrompt = `You are a senior compliance expert answering detailed questionnaires on behalf of a vendor organization. Your responses must be comprehensive, professional, and demonstrate deep expertise in compliance and security practices.

RESPONSE REQUIREMENTS:
1. Answer as the vendor directly using first-person perspective ("We implement...", "Our organization has...")
2. Provide detailed, multi-paragraph responses (minimum 3-4 sentences, ideally 2-3 paragraphs)
3. Include specific technical details, frameworks, and compliance standards when relevant
4. Reference applicable regulations (GDPR, CCPA, HIPAA, SOC 2, ISO 27001, etc.) where appropriate
5. Demonstrate implementation depth with concrete examples
6. Show ongoing commitment to compliance and security
7. Begin with a direct answer (Yes/No when applicable) followed by comprehensive details
8. Include specific processes, procedures, and safeguards
9. Mention regular reviews, audits, and continuous improvement practices
10. Reference international compliance frameworks when relevant

TONE: Professional, confident, detailed, and transparent
STRUCTURE: Direct answer + comprehensive explanation + ongoing practices/commitments
AVOID: Generic statements, vague responses, or simple yes/no answers without elaboration

Example format:
"Yes, our organization [direct answer]. [Detailed explanation of implementation with specific technical details]. [Additional context about frameworks, standards, or regulations]. [Ongoing practices and commitments to continuous improvement]."`;

    const contextData = JSON.stringify(relevantData, null, 2);
    
    try {
      console.log('Making OpenAI API request with enhanced prompting for detailed responses');
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Based on the compliance framework data below, provide a comprehensive, detailed response to this compliance question.

Reference Information:
${contextData}

Question: ${question}

Please provide a detailed, professional response that demonstrates deep compliance expertise and covers multiple aspects of the topic. Include specific frameworks, regulations, and implementation details where relevant.`
          }
        ],
        temperature: 0.2, // Lower temperature for more consistent, professional responses
        max_tokens: 1500, // Increased token limit for detailed responses
        top_p: 0.9,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });
      
      console.log('OpenAI API request successful');
      const answer = response.choices[0]?.message?.content || 
        'This information is not available in the current compliance dataset. Please consult the compliance officer.';
      
      console.log('Generated comprehensive answer (first 200 chars):', answer.substring(0, 200) + '...');
      return answer;
    } catch (err: any) {
      console.error('Error in OpenAI chat.completions.create:', err);
      
      // If it's a rate limit error or quota exceeded, return the enhanced basic response
      if (err.status === 429 || (err.error && err.error.code === 'insufficient_quota')) {
        console.log('API quota exceeded, returning enhanced basic response');
        return createEnhancedBasicResponse(question, relevantData);
      }
      
      throw err;
    }
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return 'Error generating answer. Please consult the compliance officer.';
  }
}

// Enhanced function to create comprehensive basic responses
function createEnhancedBasicResponse(question: string, relevantData: any[]): string {
  // Extract keywords from the question
  const questionLower = question.toLowerCase();
  const keywords = ['privacy', 'security', 'encryption', 'data', 'breach', 'policy', 'compliance', 'protection', 'gdpr', 'ccpa', 'hipaa', 'dpa', 'processing', 'consent', 'audit', 'training', 'access', 'control'];
  
  // Check if it's a yes/no question
  const yesNoWords = ['do you', 'does your', 'are you', 'have you', 'has your', 'is your', 'can you', 'will you'];
  const isYesNoQuestion = yesNoWords.some(phrase => questionLower.includes(phrase));
  
  let answer = '';
  
  if (questionLower.includes('privacy policy') || questionLower.includes('privacy notice')) {
    answer = `Yes, our organization maintains a comprehensive Privacy Policy that is publicly available on our website and updated regularly to reflect current regulations and business practices. Our policy provides detailed information about what personal data we collect, the purposes for which we use it, how we protect it, and the rights that individuals have regarding their data.

The Privacy Policy is designed to comply with various international data protection regulations including the General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), Health Insurance Portability and Accountability Act (HIPAA), and other applicable privacy laws in jurisdictions where we operate. We ensure that our policy covers all required elements such as data collection practices, legal bases for processing, data subject rights, retention periods, and contact information for privacy inquiries.

We regularly review and update our Privacy Policy to ensure it remains current with evolving regulatory requirements and changes in our business practices. Our legal and compliance teams conduct annual reviews, and we notify users of any material changes through appropriate channels as required by applicable laws.`;
  } else if (questionLower.includes('dpa') || questionLower.includes('data processing agreement') || questionLower.includes('sub-processor')) {
    answer = `Yes, our organization ensures that comprehensive Data Processing Agreements (DPAs) are executed with all sub-processors and third-party vendors who handle personal data on our behalf. These agreements establish clear contractual obligations and ensure that all parties maintain the same high standards of data protection that we uphold internally.

Our DPAs detail specific obligations including the scope and purpose of data processing, categories of personal data involved, retention periods, security measures, data subject rights, and breach notification procedures. We ensure these agreements comply with requirements under GDPR Article 28, CCPA service provider obligations, and other applicable data protection frameworks. The agreements also include provisions for regular audits, compliance monitoring, and immediate termination rights in case of violations.

We maintain a comprehensive vendor management program that includes due diligence assessments, ongoing monitoring, and regular compliance audits of our sub-processors. Our procurement and legal teams work together to ensure that all new vendors complete our security and privacy assessments before any DPA is finalized, and we conduct annual reviews to verify continued compliance with contractual obligations.`;
  } else if (questionLower.includes('encryption')) {
    answer = `Yes, our organization implements comprehensive encryption protocols for all personal data both at rest and in transit, utilizing industry-standard encryption algorithms and key management practices. We employ AES-256 encryption for data at rest across all storage systems, databases, and backup repositories, while using TLS 1.3 and above for all data transmissions between systems and end-user communications.

Our encryption strategy follows established frameworks including NIST Cybersecurity Framework, ISO 27001, and SOC 2 Type II requirements, with regular updates to maintain alignment with evolving security standards. We implement proper key management procedures including key rotation, secure key storage using hardware security modules (HSMs), and separation of duties for key administration. All encryption implementations undergo regular security assessments and penetration testing.

We maintain detailed encryption policies and procedures that are reviewed annually by our security team and updated based on threat landscape changes and regulatory requirements. Our incident response procedures include specific protocols for potential encryption key compromises, and we conduct regular training for technical staff on proper encryption implementation and maintenance practices.`;
  } else if (questionLower.includes('breach') || questionLower.includes('incident')) {
    answer = `Yes, our organization has established a comprehensive incident response plan that addresses data breach detection, assessment, containment, and notification requirements under various regulatory frameworks including GDPR, CCPA, HIPAA, and state breach notification laws. Our incident response team includes representatives from security, legal, compliance, communications, and executive leadership to ensure coordinated and effective response to any potential data security incidents.

Our breach response procedures include immediate containment measures, forensic investigation protocols, risk assessment methodologies, and structured notification timelines to meet regulatory requirements such as the GDPR's 72-hour notification requirement to supervisory authorities and prompt notification to affected individuals. We maintain detailed incident documentation, conduct post-incident reviews, and implement corrective actions to prevent similar occurrences.

We conduct regular incident response exercises and tabletop simulations to test our procedures and ensure team readiness. Our incident response plan is reviewed and updated annually, and all team members receive specialized training on their roles and responsibilities. We also maintain cyber insurance coverage and have established relationships with external forensic experts and legal counsel to support incident response efforts when needed.`;
  } else if (questionLower.includes('data retention') || questionLower.includes('retention policy')) {
    answer = `Yes, our organization maintains a comprehensive data retention and disposal policy that establishes clear guidelines for how long different categories of personal data are retained based on business necessity, legal requirements, and regulatory obligations. Our retention schedules are developed in compliance with various data protection laws including GDPR's data minimization principles, CCPA requirements, industry-specific regulations, and applicable statute of limitations requirements.

The policy covers all types of personal data across different business functions, with specific retention periods defined for categories such as customer data, employee records, marketing data, and transactional information. We implement automated retention controls where possible and conduct regular data purging activities to ensure that personal data is not retained longer than necessary. Our retention schedules account for litigation holds, regulatory investigations, and other legal requirements that may extend standard retention periods.

We conduct annual reviews of our retention policy and schedules to ensure they remain current with evolving business needs and regulatory requirements. Our legal, compliance, and IT teams collaborate to implement and monitor retention controls, and we provide regular training to employees on proper data handling and retention practices. We also maintain detailed documentation of our retention decisions and disposal activities for audit and compliance purposes.`;
  } else if (questionLower.includes('access control') || questionLower.includes('authorization')) {
    answer = `Yes, our organization implements a robust access control framework based on the principle of least privilege, role-based access controls (RBAC), and regular access reviews to ensure that access to personal data and sensitive systems is appropriately restricted and monitored. Our access management procedures are designed to comply with SOC 2 Type II requirements, ISO 27001 standards, and various data protection regulations including GDPR and HIPAA.

We maintain detailed access control policies that define user roles, access approval workflows, provisioning and deprovisioning procedures, and regular access certification processes. All access to sensitive data requires multi-factor authentication, and we implement additional controls such as privileged access management (PAM) solutions for administrative accounts. Our systems log all access activities, and we conduct regular monitoring and analysis of access patterns to detect potential unauthorized activities.

Our access review process includes quarterly user access recertifications, annual role-based access reviews, and immediate access revocation upon employee termination or role changes. We provide regular training to managers on their access certification responsibilities and maintain detailed documentation of all access decisions for audit purposes. Our identity and access management systems are integrated with HR systems to ensure timely updates based on personnel changes.`;
  } else if (questionLower.includes('gdpr') || questionLower.includes('data protection')) {
    answer = `Yes, our organization maintains full compliance with the General Data Protection Regulation (GDPR) and has implemented comprehensive technical and organizational measures to protect personal data and ensure respect for data subject rights. Our GDPR compliance program includes documented lawful bases for all processing activities, privacy impact assessments for high-risk processing, and robust procedures for handling data subject requests within required timeframes.

We have appointed a qualified Data Protection Officer (DPO) who oversees our data protection activities, conducts privacy impact assessments, and serves as the primary contact point for supervisory authorities and data subjects. Our compliance framework includes detailed data processing records, privacy notices, consent management systems, and cross-border data transfer safeguards including Standard Contractual Clauses and adequacy decisions where applicable.

Our GDPR compliance efforts include regular staff training, ongoing monitoring of processing activities, and annual compliance assessments by internal audit and external legal counsel. We maintain incident response procedures specifically designed to meet GDPR breach notification requirements, and we conduct regular reviews of our technical and organizational measures to ensure they remain appropriate for the risks posed by our processing activities.`;
  } else if (questionLower.includes('training') || questionLower.includes('awareness')) {
    answer = `Yes, our organization has implemented a comprehensive security and privacy awareness training program that ensures all employees understand their responsibilities regarding data protection, cybersecurity, and compliance with applicable regulations. Our training curriculum is updated annually and covers topics including data handling best practices, phishing awareness, incident reporting procedures, privacy regulations, and specific role-based security requirements.

All new employees complete mandatory security and privacy training during onboarding, and existing employees participate in annual refresher training sessions with quarterly security awareness updates. We provide specialized training for employees in high-risk roles such as IT administrators, human resources staff, and customer service representatives who regularly handle personal data. Our training includes interactive elements, real-world scenarios, and assessments to ensure comprehension and retention.

We track training completion rates, conduct regular assessments of training effectiveness, and maintain detailed records of all training activities for audit and compliance purposes. Our training program is regularly reviewed and updated based on emerging threats, regulatory changes, and lessons learned from security incidents. We also conduct periodic simulated phishing exercises and provide immediate feedback and additional training for employees who may need reinforcement of security awareness concepts.`;
  } else if (questionLower.includes('audit') || questionLower.includes('assessment')) {
    answer = `Yes, our organization conducts comprehensive security and compliance audits on a regular basis to ensure ongoing adherence to applicable regulations, industry standards, and internal policies. Our audit program includes annual SOC 2 Type II examinations, ISO 27001 certification audits, and specialized compliance assessments for regulations such as GDPR, HIPAA, and industry-specific requirements relevant to our business operations.

We engage qualified independent third-party auditors to conduct external assessments and maintain an internal audit function that performs ongoing monitoring and periodic reviews of our security controls and compliance posture. Our audit scope covers technical controls, operational procedures, vendor management, incident response capabilities, and documentation adequacy. We also conduct regular penetration testing and vulnerability assessments to identify and address potential security weaknesses.

All audit findings are tracked through completion with assigned owners, target remediation dates, and executive oversight. We maintain a formal audit committee that reviews audit results, monitors remediation progress, and provides governance oversight of our compliance program. Our audit documentation and evidence are maintained in accordance with regulatory requirements and industry best practices, and we provide regular compliance reporting to senior management and the board of directors.`;
  } else {
    // Generic comprehensive response for other topics
    answer = `Yes, our organization has implemented comprehensive security and compliance measures regarding this area, following industry best practices and applicable regulatory requirements. We maintain detailed policies and procedures that are regularly reviewed and updated to address evolving threats, regulatory changes, and business requirements. Our approach includes preventive controls, ongoing monitoring, and continuous improvement based on regular assessments and industry benchmarks.

Our compliance framework is designed to meet multiple regulatory standards including SOC 2 Type II, ISO 27001, GDPR, and other applicable requirements based on our business operations and customer needs. We conduct regular internal and external assessments to validate the effectiveness of our controls and identify opportunities for enhancement. Our governance structure includes executive oversight, dedicated compliance resources, and clear accountability for maintaining appropriate security and privacy protections.

We are committed to transparency with our customers and stakeholders regarding our security and compliance practices. We provide regular compliance documentation, participate in customer security reviews, and maintain current certifications and attestations. Our continuous improvement process includes regular benchmarking against industry standards, participation in professional organizations, and ongoing investment in security technologies and staff training to maintain our strong security posture.`;
  }
  
  // Add a note about using a comprehensive fallback response
  answer += '\n\n[Note: This is a comprehensive pre-generated response based on industry best practices. For more specific information about our implementation, please contact our compliance team directly.]';
  
  return answer;
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
    answer = 'Yes, our organization maintains a comprehensive Privacy Policy that is publicly available on our website and is regularly reviewed and updated to reflect current regulations and business practices. This policy details what personal data we collect, how we use it, the purposes for processing, and the rights of data subjects under applicable privacy laws. We ensure our Privacy Policy complies with international data protection regulations including GDPR, CCPA, HIPAA, and other applicable frameworks where we operate, providing transparency about our data handling practices and commitment to protecting individual privacy rights.';
  } else if (questionLower.includes('encryption')) {
    answer = 'Yes, our organization implements robust encryption protocols for all personal data both at rest and in transit using industry-standard algorithms and key management practices. We utilize AES-256 encryption for data at rest across all storage systems and databases, while employing TLS 1.3 for data transmission and communications. Our encryption implementation follows established security frameworks including NIST guidelines and ISO 27001 standards, with regular security assessments and updates to maintain alignment with evolving cybersecurity best practices and regulatory requirements.';
  } else if (questionLower.includes('breach') || questionLower.includes('incident')) {
    answer = 'Yes, our organization has established a comprehensive incident response plan that addresses data breach detection, assessment, containment, and notification requirements under various regulatory frameworks including GDPR, CCPA, HIPAA, and state breach notification laws. Our incident response procedures include immediate containment measures, forensic investigation protocols, and structured notification timelines to meet regulatory requirements such as GDPR\'s 72-hour notification requirement to supervisory authorities. We conduct regular incident response exercises and maintain detailed documentation of all security incidents to ensure continuous improvement of our response capabilities.';
  } else if (questionLower.includes('data retention') || questionLower.includes('retention policy')) {
    answer = 'Yes, our organization maintains a comprehensive data retention and disposal policy that establishes clear guidelines for how long different categories of personal data are retained based on business necessity, legal requirements, and regulatory obligations. Our retention schedules are developed in compliance with various data protection laws including GDPR\'s data minimization principles and CCPA requirements, with specific retention periods defined for different data categories. We implement automated retention controls where possible and conduct regular data purging activities to ensure personal data is not retained longer than necessary for its intended purposes.';
  } else if (questionLower.includes('access control') || questionLower.includes('authorization')) {
    answer = 'Yes, our organization implements strict access controls based on the principle of least privilege, role-based access control (RBAC), and regular access reviews to ensure that access to personal data and sensitive systems is appropriately restricted and monitored. All access to sensitive data requires multi-factor authentication, and we maintain detailed access control policies that define user roles, approval workflows, and certification processes. Our access management procedures are designed to comply with SOC 2 Type II requirements, ISO 27001 standards, and various data protection regulations, with quarterly access reviews and immediate revocation upon role changes or termination.';
  } else if (questionLower.includes('gdpr') || questionLower.includes('data protection')) {
    answer = 'Yes, our organization maintains full compliance with the General Data Protection Regulation (GDPR) and has implemented comprehensive technical and organizational measures to protect personal data and ensure respect for data subject rights. Our GDPR compliance program includes documented lawful bases for all processing activities, privacy impact assessments for high-risk processing, and robust procedures for handling data subject requests within required timeframes. We have appointed a qualified Data Protection Officer (DPO) and maintain detailed data processing records, privacy notices, and cross-border data transfer safeguards to ensure ongoing compliance with GDPR requirements.';
  } else if (questionLower.includes('ccpa') || questionLower.includes('california')) {
    answer = 'Yes, our organization fully complies with the California Consumer Privacy Act (CCPA) and has implemented comprehensive procedures to respect consumer rights regarding their personal information. We maintain detailed privacy notices that inform consumers about data collection practices, provide mechanisms for consumers to exercise their rights including access, deletion, and opt-out requests, and ensure that any sale or sharing of personal information is properly disclosed. Our CCPA compliance program includes regular staff training, consumer request processing procedures, and ongoing monitoring to ensure adherence to all applicable requirements under California privacy law.';
  } else if (questionLower.includes('hipaa') || questionLower.includes('health')) {
    answer = 'Yes, our organization implements all required HIPAA safeguards when handling protected health information (PHI), including comprehensive administrative, physical, and technical safeguards as required under the HIPAA Security Rule. We maintain strict privacy and security standards for healthcare data, conduct regular risk assessments, and provide specialized training for all workforce members who handle PHI. Our HIPAA compliance program includes business associate agreements with all relevant vendors, incident response procedures specific to PHI breaches, and ongoing monitoring to ensure continued compliance with all applicable HIPAA requirements.';
  } else {
    // Generic response for other topics
    answer = 'Yes, our organization has implemented comprehensive security and compliance measures regarding this topic, following industry best practices and applicable regulatory requirements. We maintain detailed policies and procedures that are regularly reviewed and updated to address evolving threats and regulatory changes. Our approach includes preventive controls, ongoing monitoring, and continuous improvement based on regular assessments and industry benchmarks to ensure we maintain the highest standards of security and compliance in all aspects of our operations.';
  }
  
  // Add a note about using a basic response
  answer += '\n\n[Note: This is a basic response generated from our compliance framework. For more detailed information about our specific implementation, please contact our compliance team directly.]';
  
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

// Landing page waitlist signup endpoint
app.post('/join-waitlist', async (req: Request, res: Response) => {
  try {
    const { email, full_name, role, organization }: CreateWaitlistEntryRequest & { full_name: string } = req.body;
    
    // Validate required fields
    if (!email || !full_name) {
      return res.status(400).json({ 
        error: 'Missing required fields: email and full_name are required' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Create waitlist entry
    const entry = await waitlistService.addToWaitlist({
      name: full_name,
      email,
      role: role || undefined,
      organization: organization || undefined
    });
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'Successfully joined the waitlist!',
      data: entry
    });
    
  } catch (error: any) {
    console.error('Landing page waitlist signup error:', error);
    if (error.message === 'Email already exists in waitlist') {
      return res.status(409).json({ 
        success: false,
        error: 'Email already registered in waitlist' 
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Add vendor routes
app.use('/api/vendors', vendorRoutes);

// Questionnaire endpoints
interface QuestionAnswer {
  question: string;
  answer: string;
  isMandatory: boolean;
  needsAttention?: boolean;
}

interface Questionnaire {
  id: string;
  name: string;
  status: string;
  progress: number;
  dueDate: string;
  answers: QuestionAnswer[];
  createdAt: string;
  updatedAt?: string;
}

// In-memory storage for questionnaires (in production, use a database)
const questionnaires: Map<string, Questionnaire> = new Map();

// Create a new questionnaire
app.post('/api/questionnaires', async (req: Request, res: Response) => {
  try {
    const { title, questions } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'At least one question is required' });
    }
    
    // Generate unique ID
    const id = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create questionnaire
    const questionnaire: Questionnaire = {
      id,
      name: title.trim(),
      status: 'Draft',
      progress: 0,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      answers: questions.map((question: string) => ({
        question: question.trim(),
        answer: '',
        isMandatory: true,
        needsAttention: false
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store in memory
    questionnaires.set(id, questionnaire);
    
    res.status(201).json(questionnaire);
  } catch (error: any) {
    console.error('Error creating questionnaire:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific questionnaire
app.get('/api/questionnaires/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const questionnaire = questionnaires.get(id);
    if (!questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }
    
    res.json(questionnaire);
  } catch (error: any) {
    console.error('Error fetching questionnaire:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a questionnaire
app.put('/api/questionnaires/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const questionnaire = questionnaires.get(id);
    if (!questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }
    
    // Update fields
    const updatedQuestionnaire: Questionnaire = {
      ...questionnaire,
      ...updates,
      id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString()
    };
    
    // Recalculate progress if answers were updated
    if (updates.answers) {
      const answeredQuestions = updatedQuestionnaire.answers.filter(qa => qa.answer && qa.answer.trim() !== '').length;
      const totalQuestions = updatedQuestionnaire.answers.length;
      updatedQuestionnaire.progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
      
      // Update status based on progress
      if (updatedQuestionnaire.progress === 100) {
        updatedQuestionnaire.status = 'Completed';
      } else if (updatedQuestionnaire.progress >= 75) {
        updatedQuestionnaire.status = 'In Review';
      } else if (updatedQuestionnaire.progress >= 25) {
        updatedQuestionnaire.status = 'In Progress';
      } else if (updatedQuestionnaire.progress > 0) {
        updatedQuestionnaire.status = 'Draft';
      } else {
        updatedQuestionnaire.status = 'Not Started';
      }
    }
    
    questionnaires.set(id, updatedQuestionnaire);
    
    res.json(updatedQuestionnaire);
  } catch (error: any) {
    console.error('Error updating questionnaire:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a questionnaire
app.delete('/api/questionnaires/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!questionnaires.has(id)) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }
    
    questionnaires.delete(id);
    
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting questionnaire:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all questionnaires for a user (simplified - no user auth in this demo)
app.get('/api/questionnaires', (req: Request, res: Response) => {
  try {
    const allQuestionnaires = Array.from(questionnaires.values());
    res.json(allQuestionnaires);
  } catch (error: any) {
    console.error('Error fetching questionnaires:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a specific question in a questionnaire
app.put('/api/questionnaires/:id/questions/:questionIndex', (req: Request, res: Response) => {
  try {
    const { id, questionIndex } = req.params;
    const { question, answer } = req.body;
    
    const questionnaire = questionnaires.get(id);
    if (!questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }
    
    const qIndex = parseInt(questionIndex);
    if (isNaN(qIndex) || qIndex < 0 || qIndex >= questionnaire.answers.length) {
      return res.status(400).json({ error: 'Invalid question index' });
    }
    
    // Update the question/answer
    questionnaire.answers[qIndex] = {
      ...questionnaire.answers[qIndex],
      ...(question && { question }),
      ...(answer !== undefined && { answer })
    };
    
    // Recalculate progress
    const answeredQuestions = questionnaire.answers.filter(qa => qa.answer && qa.answer.trim() !== '').length;
    const totalQuestions = questionnaire.answers.length;
    questionnaire.progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
    
    // Update status based on progress
    if (questionnaire.progress === 100) {
      questionnaire.status = 'Completed';
    } else if (questionnaire.progress >= 75) {
      questionnaire.status = 'In Review';
    } else if (questionnaire.progress >= 25) {
      questionnaire.status = 'In Progress';
    } else if (questionnaire.progress > 0) {
      questionnaire.status = 'Draft';
    } else {
      questionnaire.status = 'Not Started';
    }
    
    questionnaire.updatedAt = new Date().toISOString();
    
    questionnaires.set(id, questionnaire);
    
    res.json(questionnaire);
  } catch (error: any) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add batch-ask endpoint that the frontend expects
app.post('/batch-ask', async (req: Request, res: Response) => {
  try {
    console.log('Received request to /batch-ask endpoint with body:', req.body);
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Questions array is required' });
    }

    // Validate OpenAI configuration
    if (!apiKey) {
      console.log('API key not configured');
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    console.log(`Processing ${questions.length} questions in batch`);

    // Process each question in parallel
    const answers = await Promise.all(
      questions.map(async (question, index) => {
        try {
          console.log(`Processing question ${index + 1}/${questions.length}: ${question}`);
          // Find relevant compliance information
          const relevantData = findRelevantComplianceData(question, complianceData);
          
          // Generate answer using OpenAI
          const answer = await generateAnswer(question, relevantData);
          
          return { question, answer, error: null };
        } catch (error: any) {
          console.error(`Error processing question ${index + 1}: ${question}`, error);
          return { 
            question, 
            answer: "We couldn't generate an answer—please try again.", 
            error: error.message || 'Error processing question' 
          };
        }
      })
    );
    
    console.log('Batch processing completed');
    res.json({ answers });
  } catch (error: any) {
    console.error('Error processing batch questions:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Add health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'questionnaire-api',
    openai_configured: !!apiKey,
    compliance_data_loaded: complianceData.length > 0
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});