const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Check for API key
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey || apiKey.includes('XXXXXXXX')) {
  console.error('\x1b[31m%s\x1b[0m', 'ERROR: OpenAI API key is missing!');
  console.log('\x1b[33m%s\x1b[0m', 'Please set your OPENAI_API_KEY environment variable:');
  console.log('\x1b[36m%s\x1b[0m', '- Create a .env file in the chatbot directory');
  console.log('\x1b[36m%s\x1b[0m', '- Add the following line: OPENAI_API_KEY=your_actual_api_key');
  console.log('\x1b[36m%s\x1b[0m', '- Or set it directly in your environment');
  process.exit(1);
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Read the compliance framework data
const dataFilePath = path.resolve(__dirname, '../../data_new.json');
let complianceData;

try {
  const rawData = fs.readFileSync(dataFilePath, 'utf8');
  complianceData = JSON.parse(rawData);
  console.log(`Loaded compliance data: ${complianceData.length} frameworks`);
} catch (error) {
  console.error('Error loading compliance data:', error);
  process.exit(1);
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: apiKey,
});

// Helper function to detect vendor-directed questions
function isVendorDirectedQuestion(question) {
  const vendorPhrases = [
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
    'what compliance frameworks'
  ];
  
  const questionLower = question.toLowerCase();
  return vendorPhrases.some(phrase => questionLower.includes(phrase));
}

// Helper function to find relevant compliance data
function findRelevantComplianceData(question, data) {
  // Convert question to lowercase for case-insensitive matching
  const questionLower = question.toLowerCase();
  
  // Define common categories and domains to look for
  const categories = [
    'Data Privacy', 'Data Security', 'Cybersecurity', 'Compliance', 
    'Financial Privacy', 'Public Sector Privacy', 'GDPR', 'HIPAA', 'CCPA'
  ];
  
  // Score each data item based on relevance to the question
  const scoredData = data.map(item => {
    let score = 0;
    
    // Category matches are highly relevant
    if (item.category && questionLower.includes(item.category.toLowerCase())) {
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
    if (item.jurisdiction && questionLower.includes(item.jurisdiction.toLowerCase())) {
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
    .slice(0, 10); // Increase to top 10 for vendor questions to provide more comprehensive context
  
  return relevantItems.map(item => {
    const { relevanceScore, ...rest } = item;
    return rest;
  });
}

// Helper function to construct prompts based on question type
function constructPrompt(question, relevantData, isVendorQuestion) {
  const contextData = JSON.stringify(relevantData, null, 2);
  
  if (isVendorQuestion) {
    // Vendor-impersonation prompt
    return {
      systemPrompt: `You are answering as a SaaS vendor that follows GDPR, ISO 27001, and other European and Southeast Asian regulatory frameworks. You implement comprehensive security and compliance measures based on industry best practices.

When answering, speak as the vendor ("we", "our company", "our organization") and provide specific, confident responses about your compliance practices. Draw from the compliance framework information provided to demonstrate how you meet various regulatory requirements.

Use the following compliance information as the basis for your vendor's practices:`,
      temperature: 0.5,
      userContent: `Reference Information:\n${contextData}\n\nAnswer the following question from a prospective enterprise client, as if you are the vendor:\n\nQ: ${question}\nA:`
    };
  } else {
    // Generic assistant prompt
    return {
      systemPrompt: `You are a security and compliance assistant for SaaS vendors. Use the following reference information to answer the user's question accurately and concisely. Provide helpful guidance about compliance frameworks and security best practices.`,
      temperature: 0.4,
      userContent: `Reference Information:\n${contextData}\n\nQ: ${question}`
    };
  }
}

// API endpoint to answer questions (original endpoint)
app.post('/api/answer', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Detect if this is a vendor-directed question
    const isVendorQuestion = isVendorDirectedQuestion(question);
    
    // Find relevant compliance information
    const relevantData = findRelevantComplianceData(question, complianceData);
    
    // Construct prompt based on question type
    const { systemPrompt, temperature, userContent } = constructPrompt(question, relevantData, isVendorQuestion);
    
    const prompt = {
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
      max_tokens: 1000,
    };

    // Make API call to OpenAI
    const completion = await openai.chat.completions.create(prompt);
    
    // Extract answer from response
    const answer = completion.choices[0].message.content;
    
    // Return answer with question type indicator
    res.json({ 
      question, 
      answer,
      question_type: isVendorQuestion ? 'vendor_directed' : 'general_inquiry'
    });
    
  } catch (error) {
    console.error('Error processing question:', error);
    res.status(500).json({ 
      error: 'Failed to process your question', 
      details: error.message 
    });
  }
});

// API endpoint to answer questions (new endpoint for frontend compatibility)
app.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Detect if this is a vendor-directed question
    const isVendorQuestion = isVendorDirectedQuestion(question);
    
    // Find relevant compliance information
    const relevantData = findRelevantComplianceData(question, complianceData);
    
    // Construct prompt based on question type
    const { systemPrompt, temperature, userContent } = constructPrompt(question, relevantData, isVendorQuestion);
    
    const prompt = {
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
      max_tokens: 1000,
    };

    // Make API call to OpenAI
    const completion = await openai.chat.completions.create(prompt);
    
    // Extract answer from response
    const answer = completion.choices[0].message.content;
    
    // Return answer (frontend expects just 'answer' field)
    res.json({ answer });
    
  } catch (error) {
    console.error('Error processing question:', error);
    res.status(500).json({ 
      error: 'Failed to process your question', 
      details: error.message 
    });
  }
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    compliance_data: {
      total_frameworks: complianceData.length,
      categories: [...new Set(complianceData.map(item => item.category))],
    },
    features: {
      vendor_impersonation: true,
      question_type_detection: true,
      dynamic_prompting: true
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'GarnetAI Compliance Chatbot API',
    available_endpoints: ['/health', '/ask', '/api/answer', '/status'],
    features: ['Vendor Impersonation', 'Dynamic Question Type Detection', 'Context-Aware Responses']
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints available at:`);
  console.log(`  - http://localhost:${PORT}/ask`);
  console.log(`  - http://localhost:${PORT}/api/answer`);
  console.log(`  - http://localhost:${PORT}/status`);
  console.log(`Features: Vendor impersonation, Dynamic prompting, Question type detection`);
}); 