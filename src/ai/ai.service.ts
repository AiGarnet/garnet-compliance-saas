import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import OpenAI from 'openai';
import { 
  GenerateAnswerRequest, 
  AiAnswerResponse, 
  BatchAnswerRequest, 
  BatchAnswerResponse,
  ComplianceData,
  AiSuggestion
} from './entities/ai.entity';
import { CreateSuggestionDto } from './dto/ai.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      console.warn('OpenAI API key not configured. AI features will be disabled.');
    } else {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Generate AI answer for a single question
   */
  async generateAnswer(request: GenerateAnswerRequest): Promise<AiAnswerResponse> {
    if (!this.openai) {
      throw new BadRequestException('OpenAI API key not configured');
    }

    try {
      // Find relevant compliance data
      const relevantData = await this.findRelevantComplianceData(request.question);
      
      // Generate answer using OpenAI
      const answer = await this.generateOpenAIAnswer(request.question, relevantData, request.context);
      
      return {
        question: request.question,
        answer,
        success: true,
        confidence: 0.8, // Default confidence score
        sources: relevantData.map(data => data.name),
      };
    } catch (error: any) {
      console.error('Error generating AI answer:', error);
      return {
        question: request.question,
        answer: 'We couldn\'t generate an answer—please try again.',
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate AI answers for multiple questions in batch
   */
  async generateBatchAnswers(request: BatchAnswerRequest): Promise<BatchAnswerResponse> {
    if (!this.openai) {
      throw new BadRequestException('OpenAI API key not configured');
    }

    const startTime = Date.now();
    const results: AiAnswerResponse[] = [];
    let successfulAnswers = 0;
    let failedAnswers = 0;

    // Process questions in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < request.questions.length; i += batchSize) {
      const batch = request.questions.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (question: string) => {
        try {
          const result = await this.generateAnswer({
            question,
            context: request.context,
            vendorId: request.vendorId,
          });
          
          if (result.success) {
            successfulAnswers++;
          } else {
            failedAnswers++;
          }
          
          return result;
        } catch (error: any) {
          console.error(`Error generating answer for question: "${question}"`, error);
          failedAnswers++;
          return {
            question,
            answer: 'We couldn\'t generate an answer—please try again.',
            success: false,
            error: error.message,
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
            error: result.reason?.message || 'Unknown error',
          });
        }
      });
    }

    const processingTimeMs = Date.now() - startTime;

    return {
      answers: results,
      metadata: {
        totalQuestions: request.questions.length,
        successfulAnswers,
        failedAnswers,
        processingTimeMs,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Create AI suggestion for a vendor
   */
  async createSuggestion(createSuggestionDto: CreateSuggestionDto): Promise<AiSuggestion> {
    const { vendorId, questionId, suggestion, confidence, category } = createSuggestionDto;
    
    const suggestionId = uuidv4();
    
    const query = `
      INSERT INTO ai_suggestions (
        id, vendor_id, question_id, suggestion, confidence, category, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, NOW(), NOW()
      ) RETURNING 
        id,
        vendor_id as "vendorId",
        question_id as "questionId",
        suggestion,
        confidence,
        category,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const values = [suggestionId, vendorId, questionId || null, suggestion, confidence, category];
    
    const result = await this.databaseService.query(query, values);
    return result.rows[0];
  }

  /**
   * Get AI suggestions for a vendor
   */
  async getVendorSuggestions(vendorId: number): Promise<AiSuggestion[]> {
    const query = `
      SELECT 
        id,
        vendor_id as "vendorId",
        question_id as "questionId",
        suggestion,
        confidence,
        category,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM ai_suggestions 
      WHERE vendor_id = $1
      ORDER BY created_at DESC
    `;

    const result = await this.databaseService.query(query, [vendorId]);
    return result.rows;
  }

  /**
   * Find relevant compliance data for a question
   */
  private async findRelevantComplianceData(question: string): Promise<ComplianceData[]> {
    // This is a simplified version - in production, you'd have a proper compliance database
    const mockComplianceData: ComplianceData[] = [
      {
        name: 'GDPR',
        category: 'Data Privacy',
        description: 'General Data Protection Regulation for EU data protection',
        jurisdiction: 'European Union',
        domains: ['data protection', 'privacy', 'consent'],
      },
      {
        name: 'HIPAA',
        category: 'Healthcare Privacy',
        description: 'Health Insurance Portability and Accountability Act',
        jurisdiction: 'United States',
        domains: ['healthcare', 'medical records', 'patient data'],
      },
      {
        name: 'SOC 2',
        category: 'Security',
        description: 'Service Organization Control 2 for security controls',
        jurisdiction: 'Global',
        domains: ['security', 'availability', 'confidentiality'],
      },
    ];

    // Simple relevance scoring based on keyword matching
    const questionLower = question.toLowerCase();
    
    return mockComplianceData
      .map(item => {
        let score = 0;
        
        // Check for name matches
        if (questionLower.includes(item.name.toLowerCase())) {
          score += 15;
        }
        
        // Check for domain matches
        if (item.domains) {
          for (const domain of item.domains) {
            if (questionLower.includes(domain.toLowerCase())) {
              score += 5;
            }
          }
        }
        
        // Check for category matches
        if (questionLower.includes(item.category.toLowerCase())) {
          score += 10;
        }
        
        return { ...item, relevanceScore: score };
      })
      .filter(item => item.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3); // Top 3 most relevant
  }

  /**
   * Generate answer using OpenAI
   */
  private async generateOpenAIAnswer(
    question: string, 
    relevantData: ComplianceData[], 
    context?: string
  ): Promise<string> {
    // Prepare context from relevant compliance data
    let contextString = "You are a compliance expert. Use the following compliance information to answer the question:\n\n";
    
    if (relevantData.length > 0) {
      relevantData.forEach((item, index) => {
        contextString += `${index + 1}. ${item.name} (${item.jurisdiction || 'Global'}):\n`;
        contextString += `   Category: ${item.category}\n`;
        contextString += `   Description: ${item.description}\n`;
        if (item.domains && item.domains.length > 0) {
          contextString += `   Applicable Domains: ${item.domains.join(', ')}\n`;
        }
        contextString += "\n";
      });
    } else {
      contextString += "No specific compliance data found for this question. Provide a general compliance answer based on best practices.\n\n";
    }
    
    if (context) {
      contextString += `Additional Context: ${context}\n\n`;
    }
    
    contextString += `Question: ${question}\n\nPlease provide a comprehensive compliance answer:`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a compliance expert specializing in data privacy, cybersecurity, and regulatory requirements. Provide accurate, practical advice while recommending consultation with legal experts for specific implementation details."
        },
        {
          role: "user",
          content: contextString
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate an answer at this time. Please try again or contact support.';
  }
} 