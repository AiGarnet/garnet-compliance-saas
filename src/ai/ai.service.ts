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
    // Comprehensive compliance database based on Garnet AI research
    const comprehensiveComplianceData: ComplianceData[] = [
      // Data Privacy & Protection
      {
        name: 'GDPR',
        category: 'Data Privacy',
        description: 'General Data Protection Regulation - requires explicit consent, DPO appointment, 72-hour breach notification, and data processing agreements',
        jurisdiction: 'European Union',
        domains: ['data protection', 'privacy', 'consent', 'dpo', 'breach notification', 'data processing agreement'],
      },
      {
        name: 'UK GDPR',
        category: 'Data Privacy',
        description: 'UK GDPR - similar to EU GDPR with explicit consent requirements and ICO breach notification within 72 hours',
        jurisdiction: 'United Kingdom',
        domains: ['data protection', 'privacy', 'consent', 'ico', 'breach notification'],
      },
      {
        name: 'CCPA/CPRA',
        category: 'Data Privacy',
        description: 'California Consumer Privacy Act - grants rights to know, correct, delete, opt-out of sale/sharing, with specific rules for minors',
        jurisdiction: 'United States (California)',
        domains: ['consumer privacy', 'opt-out', 'data sale', 'minors consent', 'california'],
      },
      {
        name: 'PIPEDA',
        category: 'Data Privacy',
        description: 'Personal Information Protection and Electronic Documents Act - requires meaningful informed consent and breach notification for significant harm',
        jurisdiction: 'Canada',
        domains: ['informed consent', 'breach notification', 'data protection', 'canada'],
      },
      {
        name: 'Privacy Act 1988',
        category: 'Data Privacy',
        description: 'Australian Privacy Principles (APPs) - 13 principles governing transparency, collection, use, disclosure, quality, security',
        jurisdiction: 'Australia',
        domains: ['privacy principles', 'apps', 'collection notice', 'cross-border transfer'],
      },
      {
        name: 'LGPD',
        category: 'Data Privacy',
        description: 'Lei Geral de Proteção de Dados - Brazil\'s GDPR-aligned law with 3-day breach notification and DPO requirements',
        jurisdiction: 'Brazil',
        domains: ['data protection', 'consent', 'dpo', 'breach notification', 'brazil'],
      },
      {
        name: 'PIPL',
        category: 'Data Privacy',
        description: 'Personal Information Protection Law - China\'s data protection law with strict data localization and separate consent requirements',
        jurisdiction: 'China',
        domains: ['data localization', 'separate consent', 'cross-border transfer', 'china'],
      },
      
      // Financial Crime & AML/CFT
      {
        name: 'FATF Recommendations',
        category: 'Financial Crime',
        description: 'Financial Action Task Force recommendations for beneficial ownership (25% threshold), PEP screening, and suspicious transaction reporting',
        jurisdiction: 'Global',
        domains: ['beneficial ownership', 'pep screening', 'suspicious transactions', 'aml', 'cft'],
      },
      {
        name: 'FinCEN',
        category: 'Financial Crime',
        description: 'US Financial Crimes Enforcement Network - requires beneficial ownership registry and SAR reporting for transactions over $5,000',
        jurisdiction: 'United States',
        domains: ['beneficial ownership', 'sar reporting', 'fincen', 'suspicious activity'],
      },
      {
        name: 'UK PSC Register',
        category: 'Financial Crime',
        description: 'People with Significant Control register - 25% ownership threshold with public disclosure requirements',
        jurisdiction: 'United Kingdom',
        domains: ['beneficial ownership', 'psc register', 'significant control', 'ownership disclosure'],
      },
      
      // Anti-Bribery & Corruption
      {
        name: 'FCPA',
        category: 'Anti-Bribery',
        description: 'Foreign Corrupt Practices Act - prohibits bribery of foreign officials, has narrow facilitation payment exception, requires accurate books and records',
        jurisdiction: 'United States',
        domains: ['foreign bribery', 'facilitation payments', 'books and records', 'third party liability'],
      },
      {
        name: 'UK Bribery Act',
        category: 'Anti-Bribery',
        description: 'UK Bribery Act 2010 - criminalizes all bribery including facilitation payments, corporate offense for failure to prevent bribery',
        jurisdiction: 'United Kingdom',
        domains: ['bribery prevention', 'adequate procedures', 'corporate offense', 'facilitation payments'],
      },
      
      // Cybersecurity & Operational Resilience
      {
        name: 'ISO 27001',
        category: 'Cybersecurity',
        description: 'Information Security Management Systems standard - risk-based approach to protect confidentiality, integrity, availability',
        jurisdiction: 'Global',
        domains: ['isms', 'security management', 'risk assessment', 'security controls'],
      },
      {
        name: 'SOC 2 Type II',
        category: 'Cybersecurity',
        description: 'Service Organization Control 2 - independent assurance on security, availability, processing integrity, confidentiality, privacy',
        jurisdiction: 'Global',
        domains: ['security controls', 'availability', 'processing integrity', 'audit report'],
      },
      {
        name: 'NIST Cybersecurity Framework',
        category: 'Cybersecurity',
        description: 'NIST CSF - voluntary framework for managing cybersecurity risks, particularly for critical infrastructure',
        jurisdiction: 'United States',
        domains: ['cybersecurity framework', 'risk management', 'critical infrastructure', 'nist'],
      },
      {
        name: 'NIS2 Directive',
        category: 'Cybersecurity',
        description: 'Network and Information Systems Directive - EU cybersecurity baseline for critical sectors',
        jurisdiction: 'European Union',
        domains: ['cybersecurity', 'incident response', 'critical infrastructure', 'nis2'],
      },
    ];

    // Advanced relevance scoring with compliance-specific logic
    const questionLower = question.toLowerCase();
    
    return comprehensiveComplianceData
      .map(item => {
        let score = 0;
        
        // Exact name matches (highest priority)
        if (questionLower.includes(item.name.toLowerCase())) {
          score += 20;
        }
        
        // Category matches
        if (questionLower.includes(item.category.toLowerCase())) {
          score += 15;
        }
        
        // Domain matches with weighted scoring
        if (item.domains) {
          for (const domain of item.domains) {
            if (questionLower.includes(domain.toLowerCase())) {
              // Higher scores for more specific compliance terms
              if (domain.includes('notification') || domain.includes('consent') || domain.includes('screening')) {
                score += 8;
              } else if (domain.includes('dpo') || domain.includes('breach') || domain.includes('ownership')) {
                score += 10;
              } else {
                score += 5;
              }
            }
          }
        }
        
        // Jurisdiction-specific boost if mentioned
        const jurisdictionTerms = ['us', 'usa', 'united states', 'eu', 'europe', 'uk', 'britain', 'canada', 'australia', 'brazil', 'china', 'singapore', 'global'];
        for (const term of jurisdictionTerms) {
          if (questionLower.includes(term) && item.jurisdiction.toLowerCase().includes(term)) {
            score += 12;
          }
        }
        
        // Compliance-specific keyword boost
        const complianceKeywords = ['compliance', 'regulation', 'law', 'requirement', 'mandatory', 'legal', 'policy', 'framework'];
        for (const keyword of complianceKeywords) {
          if (questionLower.includes(keyword)) {
            score += 3;
          }
        }
        
        return { ...item, relevanceScore: score };
      })
      .filter(item => item.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5); // Top 5 most relevant for comprehensive coverage
  }

  /**
   * Generate answer using OpenAI
   */
  private async generateOpenAIAnswer(
    question: string, 
    relevantData: ComplianceData[], 
    context?: string
  ): Promise<string> {
    // Prepare comprehensive compliance context based on Garnet AI research
    let complianceContext = "";
    
    if (relevantData.length > 0) {
      complianceContext = "\n\nRelevant compliance frameworks and requirements:\n";
      relevantData.forEach((item, index) => {
        complianceContext += `${index + 1}. ${item.name} (${item.jurisdiction}):\n`;
        complianceContext += `   ${item.description}\n`;
        if (item.domains && item.domains.length > 0) {
          complianceContext += `   Key areas: ${item.domains.join(', ')}\n`;
        }
        complianceContext += "\n";
      });
    }
    
    // Detect question category for specialized vendor responses
    const questionLower = question.toLowerCase();
    let categoryContext = "";
    
    if (questionLower.includes('data') && (questionLower.includes('privacy') || questionLower.includes('protection') || questionLower.includes('gdpr') || questionLower.includes('ccpa'))) {
      categoryContext = "\n\nData Privacy Context: As a vendor, ensure your response addresses consent mechanisms, data processing agreements (DPAs), breach notification procedures, data subject rights, cross-border transfers, and any Data Protection Officer (DPO) arrangements as applicable to your operations.";
    } else if (questionLower.includes('beneficial') || questionLower.includes('ownership') || questionLower.includes('pep') || questionLower.includes('sanctions') || questionLower.includes('aml')) {
      categoryContext = "\n\nFinancial Crime Context: As a vendor, address beneficial ownership disclosure (typically 25% threshold), PEP screening procedures, sanctions compliance checks, suspicious activity reporting capabilities, and AML/CFT compliance measures.";
    } else if (questionLower.includes('bribery') || questionLower.includes('corruption') || questionLower.includes('fcpa') || questionLower.includes('facilitation')) {
      categoryContext = "\n\nAnti-Bribery Context: As a vendor, address your anti-bribery policies, prohibition of facilitation payments, third-party due diligence, training programs, and adequate procedures to prevent bribery as required by laws like FCPA and UK Bribery Act.";
    } else if (questionLower.includes('security') || questionLower.includes('cyber') || questionLower.includes('iso') || questionLower.includes('soc') || questionLower.includes('incident')) {
      categoryContext = "\n\nCybersecurity Context: As a vendor, address your information security management systems (ISMS), compliance with standards like ISO 27001/SOC 2, incident response procedures, access controls including multi-factor authentication, encryption practices, and business continuity planning.";
    }
    
    // Build the comprehensive vendor context
    let vendorContext = "You are a compliance-aware vendor/service provider responding to a detailed compliance questionnaire. Your organization maintains robust compliance programs across multiple jurisdictions and frameworks.";
    
    if (context) {
      vendorContext += ` Additional context: ${context}`;
    }
    
    vendorContext += complianceContext + categoryContext;
    
    const prompt = `${vendorContext}

Question: ${question}

Provide a comprehensive, professional response from your organization's perspective that demonstrates compliance awareness and specific implementation details. Your response should:

1. Use first-person organizational language ("We have implemented...", "Our organization maintains...", "We ensure compliance with...")
2. Reference specific standards, frameworks, or regulations where applicable
3. Describe actual practices and procedures rather than generic statements
4. Include specific timelines, thresholds, or metrics where relevant
5. Demonstrate proactive compliance management

Examples of strong vendor responses:
- "We maintain compliance with GDPR through explicit consent mechanisms, appointed a Data Protection Officer, and ensure 72-hour breach notification to supervisory authorities..."
- "Our beneficial ownership disclosure follows FATF recommendations with a 25% threshold, and we conduct PEP screening using World-Check database updated quarterly..."
- "We implement ISO 27001-certified information security management systems with SOC 2 Type II audits, multi-factor authentication for all administrative access, and AES-256 encryption for data at rest..."

Answer:`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a sophisticated compliance-aware vendor responding to detailed regulatory questionnaires. Your organization operates globally and maintains comprehensive compliance programs across data privacy (GDPR, CCPA, PIPEDA), financial crime prevention (AML/CFT, beneficial ownership, sanctions), anti-bribery measures (FCPA, UK Bribery Act), and cybersecurity frameworks (ISO 27001, SOC 2, NIST). Provide specific, implementation-focused responses that demonstrate deep compliance knowledge and actual operational practices. Always use first-person organizational language and reference relevant standards, timelines, and procedures."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 800, // Increased for comprehensive responses
      temperature: 0.2, // Very low temperature for consistent, professional compliance responses
    });

    return completion.choices[0]?.message?.content || 'We apologize, but we couldn\'t generate a response at this time. Please contact our compliance team directly for this information.';
  }
} 