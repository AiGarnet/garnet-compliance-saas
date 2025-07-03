import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { DigitalOceanSpacesService } from '../common/services/digitalocean-spaces.service';
import { EvidenceService } from '../evidence/evidence.service';
import OpenAI from 'openai';
import { 
  GenerateAnswerRequest, 
  AiAnswerResponse, 
  BatchAnswerRequest, 
  BatchAnswerResponse,
  ComplianceData,
  AiSuggestion,
  GeneratedSupportingDocument
} from './entities/ai.entity';
import { CreateSuggestionDto } from './dto/ai.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly spacesService: DigitalOceanSpacesService,
    private readonly evidenceService: EvidenceService,
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
    this.logger.debug(`🤖 AI SERVICE: Starting generateAnswer for question: "${request.question.substring(0, 100)}..."`);
    
    if (!this.openai) {
      this.logger.error('❌ AI SERVICE: OpenAI API key not configured');
      throw new BadRequestException('OpenAI API key not configured');
    }

    try {
      this.logger.debug(`🤖 AI SERVICE: Processing AI request for vendor ${request.vendorId}`);

      // Load relevant compliance data
      const relevantData = await this.findRelevantComplianceData(request.question);
      this.logger.debug(`🤖 AI SERVICE: Found ${relevantData.length} relevant compliance data entries`);
      
      // Load evidence files for enhanced context
      const evidenceContent = await this.getVendorEvidenceContent(request.vendorId);
      this.logger.debug(`🤖 AI SERVICE: Found ${evidenceContent.length} evidence files for context enhancement`);
      
      // Determine if this is a chat mode request
      const isChatMode = request.context?.includes('chatbot') || request.question.toLowerCase().includes('chat');

      let answer: string;
      let confidence: number;
      let sources: string[];

      if (isChatMode) {
        this.logger.debug('🤖 AI SERVICE: Using chatbot response mode');
        // Handle chatbot response with new format
        const chatbotResponse = await this.generateChatbotResponse(request.question, [], request.vendorId);
        answer = chatbotResponse.answer;
        confidence = chatbotResponse.confidence;
        sources = relevantData.map(data => data.name);
      } else {
        this.logger.debug('🤖 AI SERVICE: Using standard OpenAI answer generation');
        // Generate standard answer with evidence context
        answer = await this.generateOpenAIAnswer(request.question, relevantData, request.context, evidenceContent);
        confidence = this.calculateConfidence(request.question, relevantData, answer);
        sources = relevantData.map(data => data.name);
      }

      this.logger.debug(`🤖 AI SERVICE: Successfully generated answer with confidence ${confidence}`);
      this.logger.debug(`🤖 AI SERVICE: Answer preview: "${answer.substring(0, 200)}..."`);

      return {
        question: request.question,
        answer,
        success: true,
        confidence,
        sources,
      };

    } catch (error: any) {
      this.logger.error(`❌ AI SERVICE: Error generating answer: ${error.message}`, error.stack);
      return {
        question: request.question,
        answer: this.generateFallbackResponse(),
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
          this.logger.error(`Error generating answer for question: "${question}"`, error);
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
      results: results,
      answers: results,
      totalQuestions: request.questions.length,
      successfulAnswers: successfulAnswers,
      failedAnswers: failedAnswers,
      processingTimeMs: processingTimeMs,
      metadata: {
        successfulAnswers: successfulAnswers,
        failedAnswers: failedAnswers,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Get evidence files content for enhanced AI responses
   */
  private async getVendorEvidenceContent(vendorId: number | string): Promise<string[]> {
    try {
      if (!vendorId) {
        return [];
      }
      
      // Convert numeric vendor ID to UUID if needed
      const vendorUuid = typeof vendorId === 'number' ? 
        await this.resolveVendorUuid(vendorId) : vendorId;
      
      if (!vendorUuid) {
        return [];
      }
      
      return await this.evidenceService.getVendorEvidenceContent(vendorUuid);
    } catch (error) {
      this.logger.warn(`Failed to get evidence content for vendor ${vendorId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Resolve vendor UUID from numeric ID
   */
  private async resolveVendorUuid(vendorId: number): Promise<string | null> {
    try {
      const query = `SELECT uuid FROM vendors WHERE vendor_id = $1`;
      const result = await this.databaseService.query(query, [vendorId]);
      return result.rows.length > 0 ? result.rows[0].uuid : null;
    } catch (error) {
      this.logger.warn(`Failed to resolve vendor UUID: ${error.message}`);
      return null;
    }
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
    context?: string,
    evidenceContent?: string[]
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
    
    // Add evidence files context if available
    let evidenceContext = "";
    if (evidenceContent && evidenceContent.length > 0) {
      evidenceContext = "\n\nInternal Evidence Files Context:\n";
      evidenceContent.forEach((content, index) => {
        evidenceContext += `Evidence ${index + 1}: ${content.substring(0, 300)}...\n`;
      });
      evidenceContext += "\nUse this internal evidence to provide more specific and accurate responses about your organization's practices.\n";
    }
    
    vendorContext += complianceContext + categoryContext + evidenceContext;
    
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

  /**
   * Generate chatbot response with enhanced training and conversation context
   */
  async generateChatbotResponse(
    question: string,
    conversationHistory: any[] = [],
    vendorId?: number
  ): Promise<{
    answer: string;
    category: string;
    confidence: number;
    metadata: any;
    canRegenerate: boolean;
  }> {
    try {
      console.log('Generating chatbot response for question:', question);

      // Check if question is compliance-related
      if (!this.isComplianceRelated(question)) {
        return {
          answer: this.generateOutOfDomainResponse(),
          category: 'Out of Domain',
          confidence: 0.1,
          metadata: {
            reason: 'Question outside compliance domain',
            suggestedTopics: ['Data Privacy', 'Cybersecurity', 'Financial Crime Prevention']
          },
          canRegenerate: false
        };
      }

      // Build enhanced system and user prompts with training
      const systemPrompt = this.buildChatbotSystemPrompt();
      const userPrompt = await this.buildChatbotUserPrompt(
        question, 
        conversationHistory, 
        vendorId?.toString()
      );

      console.log('Using enhanced training prompts for OpenAI request');

      // Generate response with enhanced context
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent, professional responses
        max_tokens: 800,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const response = completion.choices[0].message.content || 'I apologize, but I was unable to generate a response. Please try asking your question again or rephrase it.';

      // Enhanced confidence calculation
      const confidence = this.calculateEnhancedConfidence(question, response, conversationHistory);
      
      // Detect compliance category
      const category = this.detectComplianceCategory(question);

      // Enhanced metadata with conversation insights
      const metadata = {
        complianceCategory: category,
        conversationTurn: conversationHistory.length + 1,
        trainingPatternUsed: this.getMatchedTrainingPattern(question),
        responseLength: response.length,
        keywordsMatched: this.getComplianceKeywords(question.toLowerCase()),
        suggestedFollowUps: this.generateFollowUpSuggestions(question, category),
        model: 'gpt-3.5-turbo',
        timestamp: new Date().toISOString()
      };

      console.log('Generated enhanced chatbot response with metadata:', metadata);

      return {
        answer: response,
        category,
        confidence,
        metadata,
        canRegenerate: true
      };

    } catch (error) {
      console.error('Error in generateChatbotResponse:', error);
      
      return {
        answer: this.generateFallbackResponse(),
        category: 'Error',
        confidence: 0.2,
        metadata: {
          error: error.message,
          fallbackUsed: true,
          timestamp: new Date().toISOString()
        },
        canRegenerate: true
      };
    }
  }

  /**
   * Calculate enhanced confidence with multiple factors
   */
  private calculateEnhancedConfidence(
    question: string, 
    response: string, 
    conversationHistory: any[]
  ): number {
    let confidence = 0.5; // Base confidence

    // Question clarity and compliance relevance
    const complianceKeywords = this.getComplianceKeywords(question.toLowerCase());
    if (complianceKeywords.length > 0) {
      confidence += 0.2;
    }

    // Response quality indicators
    if (response.length > 200) confidence += 0.1;
    if (response.includes('We implement') || response.includes('Our organization')) confidence += 0.1;
    if (response.match(/\d+\s*(days?|hours?|months?|years?)/)) confidence += 0.1; // Contains specific timelines
    if (response.match(/(ISO|SOC|NIST|GDPR|CCPA|FCPA)/i)) confidence += 0.1; // Contains standards/regulations

    // Conversation context
    if (conversationHistory.length > 0) {
      confidence += Math.min(0.1, conversationHistory.length * 0.02); // Bonus for context
    }

    // Cap at 0.95 to indicate AI uncertainty
    return Math.min(0.95, confidence);
  }

  /**
   * Get matched training pattern for metadata
   */
  private getMatchedTrainingPattern(question: string): string {
    const questionLower = question.toLowerCase();
    
    const patterns = [
      { name: 'Data Privacy', pattern: /data.*protection|privacy|gdpr|ccpa|personal.*data|consent|retention|breach/ },
      { name: 'Financial Crime', pattern: /aml|kyc|sanctions|beneficial.*ownership|pep|money.*laundering|fatf/ },
      { name: 'Cybersecurity', pattern: /security|cyber|iso.*27001|soc.*2|nist|incident.*response|penetration|vulnerability/ },
      { name: 'Operational Resilience', pattern: /business.*continuity|disaster.*recovery|backup|resilience|availability|uptime/ },
      { name: 'Anti-Bribery', pattern: /bribery|corruption|fcpa|gifts|entertainment|third.*party.*due.*diligence/ }
    ];

    for (const pattern of patterns) {
      if (pattern.pattern.test(questionLower)) {
        return pattern.name;
      }
    }

    return 'General Compliance';
  }

  /**
   * Generate follow-up suggestions based on question and category
   */
  private generateFollowUpSuggestions(question: string, category: string): string[] {
    const suggestions: Record<string, string[]> = {
      'Data Privacy': [
        'Would you like details about our data retention policies?',
        'Can I explain our approach to consent management?',
        'Should I elaborate on our cross-border transfer safeguards?'
      ],
      'Financial Crime Prevention': [
        'Would you like more details about our transaction monitoring?',
        'Can I explain our enhanced due diligence procedures?',
        'Should I describe our suspicious activity reporting process?'
      ],
      'Cybersecurity': [
        'Would you like details about our security certifications?',
        'Can I explain our incident response procedures?',
        'Should I elaborate on our vulnerability management program?'
      ],
      'Operational Resilience': [
        'Would you like more details about our testing procedures?',
        'Can I explain our crisis management protocols?',
        'Should I describe our supplier risk management?'
      ],
      'Anti-Bribery & Corruption': [
        'Would you like details about our training programs?',
        'Can I explain our third-party risk assessment process?',
        'Should I elaborate on our monitoring and reporting procedures?'
      ]
    };

    return suggestions[category] || [
      'Would you like me to elaborate on any specific aspect?',
      'Can I provide more details about our compliance framework?',
      'Should I explain related regulatory requirements?'
    ];
  }

  /**
   * Check if question is compliance-related
   */
  private isComplianceRelated(question: string): boolean {
    const complianceKeywords = [
      // Data Privacy
      'gdpr', 'ccpa', 'pipeda', 'privacy', 'data protection', 'consent', 'breach', 'dpo', 'data subject',
      'personal data', 'processing', 'controller', 'processor', 'lawful basis', 'privacy policy',
      
      // Financial Crime
      'aml', 'kyc', 'cdd', 'beneficial ownership', 'pep', 'sanctions', 'ofac', 'suspicious activity',
      'money laundering', 'terrorist financing', 'fatf', 'screening', 'transaction monitoring',
      
      // Anti-Bribery & Corruption
      'fcpa', 'bribery', 'corruption', 'facilitation payments', 'gifts', 'entertainment',
      'third party', 'due diligence', 'anti-bribery', 'uk bribery act', 'adequate procedures',
      
      // Cybersecurity
      'iso 27001', 'soc 2', 'nist', 'cybersecurity', 'information security', 'isms', 'incident response',
      'security controls', 'vulnerability', 'penetration testing', 'encryption', 'access control',
      'multi-factor authentication', 'business continuity', 'disaster recovery',
      
      // General Compliance
      'compliance', 'regulation', 'regulatory', 'audit', 'assessment', 'certification', 'framework',
      'standard', 'policy', 'procedure', 'training', 'monitoring', 'reporting', 'governance',
      'risk management', 'internal controls', 'documentation', 'evidence'
    ];

    const questionLower = question.toLowerCase();
    return complianceKeywords.some(keyword => questionLower.includes(keyword));
  }

  /**
   * Generate out-of-domain response for non-compliance questions
   */
  private generateOutOfDomainResponse(): string {
    const responses = [
      "I'm here to help with compliance and regulatory questions. Could you ask about data privacy, cybersecurity, financial crime prevention, or another compliance topic?",
      "That question seems to be outside my compliance expertise. I'd be happy to help with questions about GDPR, AML/KYC, cybersecurity frameworks, or other regulatory topics.",
      "I specialize in compliance matters. Would you like to ask about our data protection measures, security controls, or risk management procedures?",
      "I focus on compliance and regulatory topics. Perhaps you'd like to know about our privacy policies, security certifications, or anti-bribery procedures?",
      "I'm designed to assist with compliance questionnaires. Can I help you with questions about data privacy, financial crime prevention, or operational resilience?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Build chatbot system prompt with role-playing
   */
  private buildChatbotSystemPrompt(): string {
    return `You are Garnet AI's expert compliance assistant chatbot - a sophisticated AI trained on thousands of vendor due diligence questionnaires and compliance frameworks.

CORE IDENTITY & EXPERTISE:
You are responding AS the vendor/service provider being assessed. You represent a mature, compliance-aware organization with robust governance frameworks across multiple jurisdictions.

SPECIALIZED KNOWLEDGE AREAS:
• Data Privacy: GDPR, CCPA, PIPEDA, UK GDPR, ePrivacy Directive
• Financial Crime Prevention: AML/CFT, KYC/CDD, Sanctions (OFAC, EU, UN), Beneficial Ownership, PEP Screening
• Anti-Bribery & Corruption: FCPA, UK Bribery Act 2010, Third-Party Due Diligence
• Cybersecurity: ISO 27001, SOC 2 Type II, NIST Cybersecurity Framework, Cloud Security
• Operational Resilience: Business Continuity, Disaster Recovery, Risk Management

COMMUNICATION STYLE:
• Professional yet conversational and approachable
• Authoritative but patient and helpful
• Always use organizational first-person language
• Provide specific, actionable implementation details
• Include relevant metrics, timelines, and thresholds

RESPONSE FRAMEWORK:
1. Acknowledge the specific compliance area being discussed
2. Provide concrete implementation details and procedures
3. Include relevant timelines, thresholds, or frequencies
4. Reference applicable standards, frameworks, or regulations
5. Mention related processes, training, or monitoring activities
6. Offer to elaborate on specific aspects if needed

VENDOR RESPONSE PATTERNS (Training Examples):

Data Privacy Responses:
"We maintain GDPR compliance through our comprehensive data protection program. Our appointed Data Protection Officer oversees all processing activities. We respond to data subject requests within 30 days, maintain detailed records of processing activities, and conduct Data Protection Impact Assessments for high-risk processing. Our lawful bases are clearly documented, and we have explicit consent mechanisms for marketing communications."

Financial Crime Responses:
"Our AML/KYC program follows FATF recommendations and local regulatory requirements. We conduct enhanced due diligence using World-Check and proprietary databases, screen against OFAC and consolidated sanctions lists daily, and maintain beneficial ownership information with a 25% disclosure threshold. Our transaction monitoring system flags suspicious activities for investigation within 24 hours."

Cybersecurity Responses:
"We implement ISO 27001-certified information security management systems with SOC 2 Type II audits. Our incident response team follows NIST guidelines with 1-hour detection, 4-hour containment, and immediate stakeholder notification procedures. We conduct quarterly penetration testing, maintain 99.9% uptime SLAs, and require MFA for all administrative access."

CONVERSATION GUIDELINES:
• Build on previous discussion context naturally
• Proactively suggest related compliance topics
• Offer to regenerate or clarify responses when appropriate
• Maintain consistency with established organizational capabilities
• End responses with helpful follow-up suggestions when relevant

DOMAIN BOUNDARIES:
Politely redirect non-compliance questions to relevant compliance topics. Always stay within your role as a compliance-focused vendor representative.`;
  }

  /**
   * Enhanced chatbot user prompt with conversation context and training
   */
  private async buildChatbotUserPrompt(
    question: string,
    conversation: any[],
    vendorId?: string
  ): Promise<string> {
    // Get context from dataset and vendor patterns
    const datasetContext = await this.loadDatasetContext(question);
    
    // Build conversation history
    const conversationContext = conversation.length > 0 
      ? `\nConversation History (last 6 messages):\n${conversation
          .slice(-6)
          .map(msg => `${msg.role === 'user' ? 'Question' : 'Response'}: ${msg.content}`)
          .join('\n')}`
      : '';

    // Detect compliance category for specialized responses
    const complianceCategory = this.detectComplianceCategory(question);
    
    // Vendor-specific context if available
    let vendorContext = '';
    if (vendorId) {
      vendorContext = `\nVendor ID: ${vendorId} - Provide responses specific to this vendor's context.`;
    }

    // Build enhanced training examples based on question type
    const trainingExamples = this.getAdvancedTrainingExamples(question);

    return `${datasetContext}
${trainingExamples}
${conversationContext}
${vendorContext}

Current Question: "${question}"
Compliance Category: ${complianceCategory}

Instructions:
1. Respond as the vendor/service provider being assessed
2. Provide specific, implementation-focused answers with concrete details
3. Include relevant metrics, timelines, and compliance standards
4. Use professional organizational language ("We implement...", "Our organization maintains...")
5. Offer to elaborate on specific aspects or suggest related compliance topics
6. If question is vague or out of domain, politely redirect to compliance topics
7. Build naturally on the conversation history when relevant

Generate a comprehensive, helpful response that demonstrates deep compliance expertise.`;
  }

  /**
   * Get advanced training examples based on question analysis
   */
  private getAdvancedTrainingExamples(question: string): string {
    const questionLower = question.toLowerCase();
    
    // Advanced training patterns with specific implementation examples
    const advancedTraining = {
      dataPrivacy: {
        trigger: /data.*protection|privacy|gdpr|ccpa|personal.*data|consent|retention|breach/,
        examples: `
Advanced Training Examples for Data Privacy:

Q: "How do you handle GDPR Article 30 records of processing?"
A: "We maintain comprehensive Article 30 records through our centralized data mapping platform. Each processing activity includes: legal basis determination, data categories processed, recipient details, retention schedules, and international transfer safeguards. Our Data Protection Officer reviews these quarterly, and we can generate compliant documentation within 72 hours for regulatory requests."

Q: "What's your approach to Privacy by Design?"
A: "We embed Privacy by Design principles throughout our development lifecycle. This includes: conducting Data Protection Impact Assessments for new features, implementing data minimization at the database level, using pseudonymization techniques, and ensuring default privacy settings. Our engineering teams complete privacy training, and we conduct privacy reviews at each sprint milestone."

Q: "How do you manage cross-border data transfers?"
A: "We rely on Standard Contractual Clauses (SCCs) for EU transfers, supplemented by additional safeguards including encryption in transit and at rest, access controls limiting data processing to authorized personnel, and transfer impact assessments. We maintain an up-to-date inventory of all international transfers and review adequacy decisions quarterly."`
      },
      
      financialCrime: {
        trigger: /aml|kyc|sanctions|beneficial.*ownership|pep|money.*laundering|fatf/,
        examples: `
Advanced Training Examples for Financial Crime Prevention:

Q: "Describe your KYC process for corporate entities"
A: "Our corporate KYC process follows the FATF 40 Recommendations. We collect: incorporation documents, beneficial ownership declarations (25% threshold), authorized signatory information, and business purpose verification. Enhanced due diligence applies to shell companies, complex ownership structures, and high-risk jurisdictions. We utilize automated screening against global databases and conduct ongoing monitoring with quarterly reviews."

Q: "How do you handle sanctions screening?"
A: "We implement real-time sanctions screening using consolidated lists (OFAC, EU, UN, HMT). Our system performs fuzzy matching with configurable thresholds, screens beneficial owners and related parties, and maintains audit trails. We conduct daily list updates, quarterly screening effectiveness reviews, and immediate escalation procedures for potential matches. Our compliance team investigates all hits within 4 hours."

Q: "What's your approach to Suspicious Activity Reporting?"
A: "We maintain transaction monitoring rules calibrated to our risk appetite, with automated alerts for unusual patterns. Our investigation team completes reviews within 30 days, escalating to senior management for SAR filing decisions. We file SARs within regulatory timeframes, maintain confidentiality protocols, and conduct annual effectiveness reviews with our compliance consultant."`
      },
      
      cybersecurity: {
        trigger: /security|cyber|iso.*27001|soc.*2|nist|incident.*response|penetration|vulnerability/,
        examples: `
Advanced Training Examples for Cybersecurity:

Q: "Describe your ISO 27001 implementation"
A: "We maintain ISO 27001:2013 certification with annual surveillance audits. Our Information Security Management System covers: risk assessment methodologies, control implementation across 14 domains, management review processes, and continuous improvement cycles. We conduct internal audits quarterly, maintain a risk register with 134 identified risks, and ensure 98% control effectiveness through automated monitoring."

Q: "What's your incident response capability?"
A: "Our incident response follows NIST guidelines with a 24/7 SOC capability. Detection occurs within 15 minutes through SIEM correlation, containment within 1 hour, and stakeholder notification within 4 hours. We maintain incident playbooks for 12 attack vectors, conduct quarterly tabletop exercises, and provide post-incident reports within 72 hours including root cause analysis and remediation plans."

Q: "How do you manage third-party security risks?"
A: "We implement a comprehensive vendor risk assessment program. All vendors complete security questionnaires, provide certifications (SOC 2, ISO 27001), and undergo risk scoring. Critical vendors receive on-site assessments, penetration testing verification, and contractual security requirements. We maintain a vendor risk register, conduct annual reviews, and require immediate notification of security incidents."`
      },
      
      operationalResilience: {
        trigger: /business.*continuity|disaster.*recovery|backup|resilience|availability|uptime/,
        examples: `
Advanced Training Examples for Operational Resilience:

Q: "What are your business continuity capabilities?"
A: "We maintain comprehensive business continuity plans with Recovery Time Objectives (RTO) of 4 hours and Recovery Point Objectives (RPO) of 1 hour for critical systems. Our plans cover: crisis management procedures, alternate site operations, communication protocols, and supplier dependencies. We conduct annual testing, maintain emergency contacts, and ensure 99.9% availability through redundant infrastructure."

Q: "Describe your disaster recovery testing"
A: "We perform quarterly disaster recovery tests including: full system failover, data restoration verification, communication system activation, and staff notification procedures. Each test includes defined success criteria, timing measurements, and improvement recommendations. Annual tests involve complete site failover with staff working from alternate locations for 48 hours."

Q: "How do you ensure operational resilience in cloud environments?"
A: "We implement multi-region cloud architecture with automated failover capabilities. Our approach includes: geographic distribution across 3 availability zones, real-time data replication, automated backup verification, and continuous health monitoring. We maintain cloud-native disaster recovery with sub-15-minute failover times and conduct monthly resilience testing."`
      }
    };

    // Find matching training category
    for (const [category, training] of Object.entries(advancedTraining)) {
      if (training.trigger.test(questionLower)) {
        return training.examples;
      }
    }

    // General compliance training
    return `
General Compliance Training Examples:

Focus on providing:
• Specific implementation details and procedures
• Concrete timelines, thresholds, and metrics
• Reference to relevant standards and frameworks
• Training and monitoring activities
• Escalation and review procedures
• Evidence of continuous improvement

Use organizational perspective and demonstrate mature compliance posture.`;
  }

  /**
   * Enhanced compliance category detection
   */
  private detectComplianceCategory(question: string): string {
    const questionLower = question.toLowerCase();
    
    const categories = [
      { name: 'Data Privacy', keywords: ['data protection', 'privacy', 'gdpr', 'ccpa', 'pipeda', 'consent', 'breach notification', 'data subject'] },
      { name: 'Financial Crime Prevention', keywords: ['aml', 'kyc', 'sanctions', 'beneficial ownership', 'pep screening', 'transaction monitoring'] },
      { name: 'Anti-Bribery & Corruption', keywords: ['bribery', 'corruption', 'fcpa', 'uk bribery act', 'gifts', 'entertainment', 'third party due diligence'] },
      { name: 'Cybersecurity', keywords: ['security controls', 'cybersecurity', 'iso 27001', 'soc 2', 'nist', 'incident response', 'penetration testing'] },
      { name: 'Operational Resilience', keywords: ['business continuity', 'disaster recovery', 'backup', 'availability', 'uptime', 'resilience'] },
      { name: 'Environmental & Social Governance', keywords: ['esg', 'sustainability', 'environmental', 'social responsibility', 'governance'] },
      { name: 'Regulatory Compliance', keywords: ['regulatory', 'compliance program', 'risk management', 'audit', 'policies', 'procedures'] }
    ];

    for (const category of categories) {
      if (category.keywords.some(keyword => questionLower.includes(keyword))) {
        return category.name;
      }
    }

    return 'General Compliance';
  }

  /**
   * Load relevant context from dataset and vendor question patterns
   */
  private async loadDatasetContext(question: string): Promise<string> {
    try {
      // Load and search the dataset for relevant information
      const fs = require('fs');
      const path = require('path');
      const datasetPath = path.join(process.cwd(), 'data_new.json');
      
      if (!fs.existsSync(datasetPath)) {
        return this.getVendorQuestionPatterns(question);
      }

      const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
      const questionLower = question.toLowerCase();
      
      // Find relevant entries from dataset with enhanced matching
      const relevantEntries = dataset
        .filter((entry: any) => {
          const searchFields = [
            entry.name || '',
            entry.description || '',
            (entry.domains || []).join(' '),
            entry.category || '',
            entry.requirement || '',
            entry.jurisdiction || ''
          ].join(' ').toLowerCase();
          
          // Enhanced keyword matching for compliance questions
          const questionWords = questionLower.split(/\s+/).filter(word => word.length > 2);
          return questionWords.some(word => searchFields.includes(word)) ||
                 this.getComplianceKeywords(questionLower).some(keyword => searchFields.includes(keyword));
        })
        .slice(0, 5); // Top 5 most relevant

      let datasetContext = '';
      if (relevantEntries.length > 0) {
        datasetContext = `Regulatory Context:\n${relevantEntries.map((entry: any) => 
          `- ${entry.name}: ${entry.requirement || entry.description}\n  Jurisdiction: ${entry.jurisdiction || 'Global'}`
        ).join('\n')}`;
      }

      // Add vendor question patterns for better training
      const vendorPatterns = this.getVendorQuestionPatterns(question);
      
      return datasetContext + (datasetContext ? '\n\n' : '') + vendorPatterns;

    } catch (error) {
      console.error('Error loading dataset context:', error);
      return this.getVendorQuestionPatterns(question);
    }
  }

  /**
   * Get compliance-specific keywords for better matching
   */
  private getComplianceKeywords(question: string): string[] {
    const keywordMap: Record<string, string[]> = {
      'data privacy': ['gdpr', 'ccpa', 'pipeda', 'data protection', 'privacy policy', 'consent', 'breach notification'],
      'financial crime': ['aml', 'kyc', 'sanctions', 'beneficial ownership', 'pep screening', 'transaction monitoring'],
      'cybersecurity': ['iso 27001', 'soc 2', 'nist', 'incident response', 'vulnerability management', 'penetration testing'],
      'anti-bribery': ['fcpa', 'uk bribery act', 'due diligence', 'third party risk', 'gifts and entertainment']
    };

    const foundKeywords: string[] = [];
    for (const [category, keywords] of Object.entries(keywordMap)) {
      if (keywords.some(keyword => question.includes(keyword))) {
        foundKeywords.push(...keywords);
      }
    }
    
    return foundKeywords;
  }

  /**
   * Get vendor question patterns and training examples
   */
  private getVendorQuestionPatterns(question: string): string {
    const questionLower = question.toLowerCase();
    
    // Common vendor question patterns with example responses
    const vendorQuestionPatterns = [
      // Data Privacy Questions
      {
        pattern: /data.*protection|privacy.*policy|gdpr|ccpa|personal.*data/,
        category: 'Data Privacy',
        examples: [
          'How do you handle GDPR data subject requests?',
          'What is your data retention policy?',
          'Do you have a Data Protection Officer?',
          'How do you obtain consent for data processing?'
        ],
        responseGuidance: 'Provide specific procedures, timelines (e.g., 30 days for GDPR requests), mention DPO appointment, describe consent mechanisms, and reference legal bases for processing.'
      },
      
      // Security Questions
      {
        pattern: /security.*control|cybersecurity|incident.*response|iso.*27001|soc.*2/,
        category: 'Cybersecurity',
        examples: [
          'What cybersecurity frameworks do you follow?',
          'How do you handle security incidents?',
          'Do you perform regular penetration testing?',
          'What access controls do you have in place?'
        ],
        responseGuidance: 'Reference specific standards (ISO 27001, SOC 2), describe ISMS implementation, mention incident response timelines, and detail technical controls like MFA, encryption.'
      },
      
      // Financial Crime Questions
      {
        pattern: /aml|kyc|sanctions|beneficial.*ownership|pep.*screening|money.*laundering/,
        category: 'Financial Crime',
        examples: [
          'How do you conduct AML/KYC screening?',
          'What is your sanctions compliance process?',
          'How do you verify beneficial ownership?',
          'Do you screen against PEP lists?'
        ],
        responseGuidance: 'Mention specific screening databases (World-Check, OFAC), describe 25% beneficial ownership thresholds, detail ongoing monitoring processes, and reference FATF recommendations.'
      },
      
      // Anti-Bribery Questions
      {
        pattern: /bribery|corruption|fcpa|gifts|entertainment|third.*party.*due.*diligence/,
        category: 'Anti-Bribery',
        examples: [
          'What is your anti-bribery policy?',
          'How do you handle gifts and entertainment?',
          'Do you conduct third-party due diligence?',
          'Are you FCPA compliant?'
        ],
        responseGuidance: 'Reference zero-tolerance policies, mention specific monetary thresholds for gifts, describe third-party risk assessments, and detail training programs.'
      },
      
      // Operational Resilience
      {
        pattern: /business.*continuity|disaster.*recovery|backup|availability|uptime/,
        category: 'Operational Resilience',
        examples: [
          'What is your business continuity plan?',
          'How do you handle disaster recovery?',
          'What are your uptime guarantees?',
          'How often do you test your backups?'
        ],
        responseGuidance: 'Provide specific RTOs/RPOs, mention testing frequencies, describe backup strategies, and reference industry standards for availability.'
      }
    ];

    // Find matching pattern
    const matchedPattern = vendorQuestionPatterns.find(pattern => 
      pattern.pattern.test(questionLower)
    );

    if (matchedPattern) {
      return `
Vendor Question Training Context:
Category: ${matchedPattern.category}

Similar Questions Vendors Ask:
${matchedPattern.examples.map(q => `• ${q}`).join('\n')}

Response Guidance: ${matchedPattern.responseGuidance}

Expected Response Style: Professional, specific, implementation-focused with concrete details, timelines, and standards references.`;
    }

    // Generic vendor guidance
    return `
Vendor Question Training Context:
General compliance inquiry detected.

Response Guidelines:
• Use organizational first-person language ("We implement...", "Our organization maintains...")
• Provide specific procedures and timelines where applicable
• Reference relevant standards and frameworks
• Include compliance measures and controls
• Mention training and monitoring programs
• Be professional and implementation-focused
`;
  }

  /**
   * Calculate confidence score based on various factors
   */
  private calculateConfidence(question: string, relevantData: ComplianceData[], answer: string): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence based on relevant data found
    if (relevantData.length > 0) {
      confidence += 0.2;
      if (relevantData.length >= 3) confidence += 0.1;
    }

    // Boost confidence for specific compliance keywords
    const specificKeywords = ['gdpr', 'iso 27001', 'soc 2', 'fcpa', 'aml', 'kyc'];
    if (specificKeywords.some(keyword => question.toLowerCase().includes(keyword))) {
      confidence += 0.15;
    }

    // Boost confidence for comprehensive answers
    if (answer.length > 500) confidence += 0.1;
    if (answer.includes('We implement') || answer.includes('Our organization')) confidence += 0.05;

    return Math.min(confidence, 0.95); // Cap at 95%
  }

  /**
   * Generate fallback response for errors
   */
  private generateFallbackResponse(): string {
    return "I apologize, but I'm experiencing some technical difficulties. Please try rephrasing your compliance question, and I'll do my best to provide a helpful response about our regulatory procedures and controls.";
  }

  /**
   * Generate a supporting document using AI with enhanced context
   */
  async generateSupportingDocument(
    title: string,
    instructions?: string,
    category?: string,
    vendorId?: number
  ): Promise<GeneratedSupportingDocument> {
    this.logger.debug(`🤖 AI SERVICE: Starting enhanced generateSupportingDocument for "${title}"`);
    
    if (!this.openai) {
      this.logger.error('❌ AI SERVICE: OpenAI API key not configured');
      throw new BadRequestException('OpenAI API key not configured');
    }

    try {
      // Step 1: Gather vendor context and compliance data
      const vendorContext = await this.getVendorComplianceContext(vendorId);
      const questionnaireContext = await this.getVendorQuestionnaireContext(vendorId);
      const evidenceContext = await this.getVendorEvidenceContent(vendorId);
      const complianceFrameworks = await this.getRelevantComplianceFrameworks(title, category);

      // Step 2: Build enhanced prompt with full context
      const enhancedPrompt = await this.buildEnhancedDocumentPrompt(
        title, 
        instructions, 
        category, 
        vendorContext,
        questionnaireContext,
        evidenceContext,
        complianceFrameworks
      );

      this.logger.debug('🤖 AI SERVICE: Sending enhanced request to OpenAI for document generation');
      this.logger.debug(`🤖 AI SERVICE: Vendor context: ${vendorContext ? 'Available' : 'None'}`);
      this.logger.debug(`🤖 AI SERVICE: Questionnaire context: ${questionnaireContext.length} questions/answers`);
      this.logger.debug(`🤖 AI SERVICE: Evidence files: ${evidenceContext.length} files`);
      
      // Step 3: Call OpenAI with enhanced context
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o", // Using GPT-4o for comprehensive document generation
        messages: [
          {
            role: "system",
            content: this.buildEnhancedSystemPrompt()
          },
          {
            role: "user",
            content: enhancedPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.2, // Low temperature for consistent, factual output
      });

      const content = completion.choices[0]?.message?.content || 'Failed to generate document content.';
      
      // Step 4: Log success with context details
      this.logger.debug(`🤖 AI SERVICE: Successfully generated enhanced supporting document "${title}"`);
      this.logger.debug(`🤖 AI SERVICE: Generated content length: ${content.length} characters`);
      
      return {
        title,
        content,
        success: true
      };
    } catch (error: any) {
      this.logger.error(`❌ AI SERVICE: Error generating supporting document: ${error.message}`, error.stack);
      
      return {
        title,
        content: '',
        success: false,
        error: error.message || 'Failed to generate supporting document'
      };
    }
  }

  /**
   * Get vendor compliance context including company info and industry
   */
  private async getVendorComplianceContext(vendorId?: number): Promise<any> {
    if (!vendorId) {
      return null;
    }

    try {
      const query = `
        SELECT 
          company_name,
          industry,
          region,
          description,
          website,
          contact_email,
          created_at
        FROM vendors 
        WHERE vendor_id = $1
      `;
      
      const result = await this.databaseService.query(query, [vendorId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      this.logger.warn(`Failed to get vendor context for ${vendorId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get vendor questionnaire context including questions and answers
   */
  private async getVendorQuestionnaireContext(vendorId?: number): Promise<Array<{question: string, answer?: string, category?: string}>> {
    if (!vendorId) {
      return [];
    }

    try {
      // Get questionnaire questions and answers for this vendor
      const query = `
        SELECT 
          cq.question_text,
          cq.ai_answer,
          cq.requires_document,
          cq.document_description,
          cl.name as checklist_name
        FROM checklist_questions cq
        JOIN checklists cl ON cq.checklist_id = cl.id
        WHERE cl.vendor_id = $1
        AND cq.ai_answer IS NOT NULL
        ORDER BY cq.created_at DESC
        LIMIT 20
      `;
      
      const result = await this.databaseService.query(query, [vendorId]);
      
      return result.rows.map(row => ({
        question: row.question_text,
        answer: row.ai_answer,
        category: row.checklist_name,
        requiresDocument: row.requires_document,
        documentDescription: row.document_description
      }));
    } catch (error) {
      this.logger.warn(`Failed to get questionnaire context for vendor ${vendorId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Get relevant compliance frameworks based on document title and category
   */
  private async getRelevantComplianceFrameworks(title: string, category?: string): Promise<ComplianceData[]> {
    const searchTerms = `${title} ${category || ''}`.toLowerCase();
    const relevantData = await this.findRelevantComplianceData(searchTerms);
    
    // Return top 5 most relevant frameworks
    return relevantData.slice(0, 5);
  }

  /**
   * Build enhanced document prompt with full context
   */
  private async buildEnhancedDocumentPrompt(
    title: string,
    instructions?: string,
    category?: string,
    vendorContext?: any,
    questionnaireContext?: Array<{question: string, answer?: string, category?: string}>,
    evidenceContext?: string[],
    complianceFrameworks?: ComplianceData[]
  ): Promise<string> {
    let prompt = `Generate a comprehensive, professional compliance evidence document titled "${title}".\n\n`;

    // Add vendor context
    if (vendorContext) {
      prompt += `COMPANY CONTEXT:\n`;
      prompt += `- Company: ${vendorContext.company_name}\n`;
      if (vendorContext.industry) prompt += `- Industry: ${vendorContext.industry}\n`;
      if (vendorContext.region) prompt += `- Region: ${vendorContext.region}\n`;
      if (vendorContext.description) prompt += `- Description: ${vendorContext.description}\n`;
      prompt += `\n`;
    }

    // Add questionnaire context
    if (questionnaireContext && questionnaireContext.length > 0) {
      prompt += `QUESTIONNAIRE CONTEXT:\n`;
      prompt += `This document should support answers to the following compliance questions:\n\n`;
      
      questionnaireContext.slice(0, 10).forEach((item, index) => {
        prompt += `${index + 1}. Q: ${item.question}\n`;
        if (item.answer) {
          prompt += `   A: ${item.answer.substring(0, 200)}${item.answer.length > 200 ? '...' : ''}\n`;
        }
        prompt += `\n`;
      });
    }

    // Add evidence context
    if (evidenceContext && evidenceContext.length > 0) {
      prompt += `EXISTING EVIDENCE FILES:\n`;
      prompt += `The following evidence files are already available for this company:\n`;
      evidenceContext.slice(0, 10).forEach((evidence, index) => {
        prompt += `- ${evidence.substring(0, 100)}${evidence.length > 100 ? '...' : ''}\n`;
      });
      prompt += `\nEnsure this new document complements but doesn't duplicate existing evidence.\n\n`;
    }

    // Add compliance frameworks context
    if (complianceFrameworks && complianceFrameworks.length > 0) {
      prompt += `RELEVANT COMPLIANCE FRAMEWORKS:\n`;
      complianceFrameworks.forEach(framework => {
        prompt += `- ${framework.name} (${framework.jurisdiction}): ${framework.description}\n`;
      });
      prompt += `\n`;
    }

    // Add category-specific requirements
    if (category) {
      prompt += `DOCUMENT CATEGORY: ${category}\n\n`;
      prompt += this.getCategorySpecificRequirements(category);
    }

    // Add specific instructions
    if (instructions) {
      prompt += `SPECIFIC INSTRUCTIONS:\n${instructions}\n\n`;
    }

    // Add formatting requirements
    prompt += `FORMATTING REQUIREMENTS:\n`;
    prompt += `Create a professional evidence document that includes:\n`;
    prompt += `1. Executive Summary\n`;
    prompt += `2. Detailed compliance statement addressing relevant frameworks\n`;
    prompt += `3. Implementation details with specific controls and procedures\n`;
    prompt += `4. Evidence of compliance (policies, procedures, technical controls)\n`;
    prompt += `5. Monitoring and review processes\n`;
    prompt += `6. Contact information and document control\n\n`;
    
    prompt += `The document should be:\n`;
    prompt += `- Specific to the company and industry context provided\n`;
    prompt += `- Directly address the compliance questions from the questionnaire\n`;
    prompt += `- Reference relevant compliance frameworks and standards\n`;
    prompt += `- Include realistic implementation details\n`;
    prompt += `- Be ready for compliance audits and reviews\n`;
    prompt += `- Use professional, precise language appropriate for regulators\n\n`;

    prompt += `Generate a complete, ready-to-use compliance evidence document.`;

    return prompt;
  }

  /**
   * Get category-specific requirements for document generation
   */
  private getCategorySpecificRequirements(category: string): string {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('privacy') || categoryLower.includes('data')) {
      return `For data privacy documents, include:\n- Data mapping and classification\n- Privacy impact assessments\n- Consent management procedures\n- Data retention and deletion policies\n- Breach response procedures\n- International transfer safeguards\n- Subject rights management\n\n`;
    }
    
    if (categoryLower.includes('security') || categoryLower.includes('cyber')) {
      return `For security documents, include:\n- Security risk assessments\n- Access control policies and procedures\n- Encryption standards and key management\n- Incident response plans\n- Vulnerability management processes\n- Security monitoring and logging\n- Third-party security assessments\n\n`;
    }
    
    if (categoryLower.includes('financial') || categoryLower.includes('aml')) {
      return `For financial compliance documents, include:\n- Customer due diligence procedures\n- Transaction monitoring systems\n- Beneficial ownership verification\n- Suspicious activity reporting\n- Record keeping requirements\n- Training and awareness programs\n- Independent testing and validation\n\n`;
    }
    
    if (categoryLower.includes('policy') || categoryLower.includes('procedure')) {
      return `For policy documents, include:\n- Purpose and scope statements\n- Roles and responsibilities\n- Detailed procedures and workflows\n- Compliance monitoring and enforcement\n- Training requirements\n- Review and update processes\n- Exception handling procedures\n\n`;
    }
    
    return `For this document category, include relevant industry-specific requirements and best practices.\n\n`;
  }

  /**
   * Build enhanced system prompt for compliance document generation
   */
  private buildEnhancedSystemPrompt(): string {
    return `You are an expert compliance officer and technical writer specializing in creating professional evidence documents for regulatory compliance.

Your expertise includes:
- Deep knowledge of global compliance frameworks (GDPR, SOX, ISO 27001, SOC 2, NIST, etc.)
- Industry-specific compliance requirements across financial services, healthcare, technology, and other sectors
- Technical implementation of compliance controls and procedures
- Audit preparation and regulatory documentation

When generating documents:
1. Create realistic, implementable compliance evidence
2. Use specific technical details appropriate to the company's industry
3. Reference actual compliance frameworks and standards
4. Include concrete examples of policies, procedures, and controls
5. Ensure documents would pass regulatory scrutiny
6. Make content specific to the company context provided
7. Address the specific compliance questions from questionnaires
8. Create comprehensive but focused documentation

Your documents should be professional, detailed, and ready for immediate use in compliance audits and regulatory reviews.`;
  }

  /**
   * Generate and save a supporting document using OpenAI with enhanced context
   */
  async generateAndSaveSupportingDocument(
    title: string,
    instructions?: string,
    category?: string,
    vendorId?: number,
    questionId?: string
  ): Promise<{ 
    success: boolean; 
    document?: any; 
    error?: string; 
    downloadUrl?: string;
    documentId?: string;
  }> {
    this.logger.debug(`🤖 AI SERVICE: Starting generateAndSaveSupportingDocument for "${title}"`);
    
    if (!this.openai) {
      this.logger.error('❌ AI SERVICE: OpenAI API key not configured');
      throw new BadRequestException('OpenAI API key not configured');
    }

    if (!vendorId) {
      this.logger.error('❌ AI SERVICE: Vendor ID is required');
      throw new BadRequestException('Vendor ID is required');
    }

    try {
      // Step 1: Generate the document content using enhanced context
      const generatedDoc = await this.generateSupportingDocument(title, instructions, category, vendorId);
      
      if (!generatedDoc.success) {
        return {
          success: false,
          error: generatedDoc.error || 'Failed to generate document content'
        };
      }

      // Step 2: Create a formatted text file from the generated content
      const documentContent = `${generatedDoc.title}\n${'='.repeat(generatedDoc.title.length)}\n\n${generatedDoc.content}`;
      const documentBuffer = Buffer.from(documentContent, 'utf8');
      const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.txt`;

      // Step 3: Upload to DigitalOcean Spaces
      const uploadResult = await this.spacesService.uploadSupportingDocument(
        documentBuffer,
        filename,
        'text/plain',
        vendorId.toString(),
        questionId
      );

      // Step 4: Save to database
      const documentRecord = await this.saveSupportingDocumentToDatabase(
        vendorId.toString(),
        questionId,
        filename,
        'text/plain',
        documentBuffer.length,
        uploadResult.key,
        uploadResult.url
      );

      this.logger.debug(`🤖 AI SERVICE: Successfully generated and saved supporting document "${title}"`);
      
      return {
        success: true,
        document: documentRecord,
        downloadUrl: uploadResult.url,
        documentId: documentRecord.id
      };

    } catch (error: any) {
      this.logger.error(`❌ AI SERVICE: Error generating and saving supporting document: ${error.message}`, error.stack);
      
      return {
        success: false,
        error: error.message || 'Failed to generate and save supporting document'
      };
    }
  }

  /**
   * Save supporting document to database
   */
  private async saveSupportingDocumentToDatabase(
    vendorId: string,
    questionId: string | undefined,
    filename: string,
    fileType: string,
    fileSize: number,
    spacesKey: string,
    spacesUrl: string
  ): Promise<any> {
    const query = `
      INSERT INTO checklist_supporting_documents 
      (vendor_id, question_id, filename, file_type, file_size, spaces_key, spaces_url, uploaded_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;
    
    const values = [vendorId, questionId, filename, fileType, fileSize, spacesKey, spacesUrl];
    
    const result = await this.databaseService.query(query, values);
    return result.rows[0];
  }
} 