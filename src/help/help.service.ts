import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AiService } from '../ai/ai.service';
import {
  CreateHelpRequestDto,
  HelpRequestResponseDto,
  ChatResponseDto,
} from './dto/help.dto';
import { HelpRequest } from './entities/help.entity';

@Injectable()
export class HelpService {
  private readonly logger = new Logger(HelpService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Create a new help request and process it with AI
   */
  async createHelpRequest(
    createHelpRequestDto: CreateHelpRequestDto,
  ): Promise<HelpRequestResponseDto> {
    const { vendorId, question, context, category } = createHelpRequestDto;

    this.logger.log(
      `Processing help request for vendor ${vendorId}: ${question.substring(0, 100)}...`,
    );

    try {
      // Generate AI response using the existing AI service
      const aiResponse = await this.aiService.generateChatbotResponse(
        question,
        [], // Empty conversation history for now
        undefined, // vendorId as number (will be converted in AI service)
      );

      // Validate that the question is compliance-related
      if (!aiResponse.metadata?.isComplianceRelated && !this.isComplianceRelated(question)) {
        aiResponse.answer = 
          "I can only assist with compliance-related questions such as data privacy, cybersecurity, financial regulations, and vendor risk management. " +
          "Please ask a question related to compliance, supporting documents, or regulatory requirements.";
        aiResponse.category = 'Out of Domain';
        aiResponse.confidence = 0.1;
      }

      // Save to database
      const helpRequest = await this.saveHelpRequest({
        vendorId,
        userQuestion: question,
        aiResponse: aiResponse.answer,
        category: aiResponse.category,
        confidenceScore: aiResponse.confidence,
        isComplianceRelated: aiResponse.metadata?.isComplianceRelated ?? this.isComplianceRelated(question),
        conversationContext: { context, originalCategory: category },
        metadata: aiResponse.metadata,
        status: 'resolved',
      });

      this.logger.log(`Help request ${helpRequest.id} created successfully`);

      return helpRequest;
    } catch (error) {
      this.logger.error(`Error processing help request: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to process help request');
    }
  }

  /**
   * Process a chat message and return immediate response
   */
  async processChatMessage(
    question: string,
    vendorId: string,
  ): Promise<ChatResponseDto> {
    this.logger.log(`Processing chat message for vendor ${vendorId}`);

    try {
      // Check if question is compliance-related first
      if (!this.isComplianceRelated(question)) {
        return {
          answer: 
            "I can only assist with compliance-related questions such as:\n" +
            "• Data privacy and GDPR compliance\n" +
            "• Cybersecurity frameworks and controls\n" +
            "• Financial regulations and risk management\n" +
            "• Vendor risk assessment processes\n" +
            "• Supporting documentation requirements\n\n" +
            "Please ask a question related to these compliance topics.",
          category: 'Out of Domain',
          confidence: 0.1,
          metadata: {
            isComplianceRelated: false,
            suggestedTopics: [
              'Data Privacy',
              'Cybersecurity',
              'Financial Crime Prevention',
              'Vendor Risk Management'
            ]
          },
          canRegenerate: false,
          isComplianceRelated: false,
          followUpSuggestions: [
            "What documents do I need for GDPR compliance?",
            "How do I assess cybersecurity risks?",
            "What are the key financial compliance requirements?"
          ]
        };
      }

      // Get conversation history for context
      const conversationHistory = await this.getRecentConversationHistory(vendorId, 5);

      // Generate AI response
      const aiResponse = await this.aiService.generateChatbotResponse(
        question,
        conversationHistory,
        undefined, // vendorId as number
      );

      // Save this interaction for future context
      await this.saveHelpRequest({
        vendorId,
        userQuestion: question,
        aiResponse: aiResponse.answer,
        category: aiResponse.category,
        confidenceScore: aiResponse.confidence,
        isComplianceRelated: true,
        conversationContext: { conversationHistory },
        metadata: aiResponse.metadata,
        status: 'resolved',
      });

      return {
        answer: aiResponse.answer,
        category: aiResponse.category,
        confidence: aiResponse.confidence,
        metadata: aiResponse.metadata,
        canRegenerate: aiResponse.canRegenerate,
        isComplianceRelated: true,
        followUpSuggestions: this.generateFollowUpSuggestions(aiResponse.category),
      };
    } catch (error) {
      this.logger.error(`Error processing chat message: ${error.message}`, error.stack);
      return {
        answer: 'I apologize, but I encountered an error processing your question. Please try again or rephrase your question.',
        category: 'Error',
        confidence: 0,
        metadata: { error: error.message },
        canRegenerate: true,
        isComplianceRelated: false,
      };
    }
  }

  /**
   * Get help history for a vendor
   */
  async getVendorHelpHistory(vendorId: string): Promise<HelpRequest[]> {
    this.logger.log(`Getting help history for vendor ${vendorId}`);

    try {
      const query = `
        SELECT 
          id,
          vendor_id as "vendorId",
          user_question as "userQuestion",
          ai_response as "aiResponse",
          category,
          confidence_score as "confidenceScore",
          is_compliance_related as "isComplianceRelated",
          conversation_context as "conversationContext",
          metadata,
          status,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM help_requests 
        WHERE vendor_id = $1 
        ORDER BY created_at DESC 
        LIMIT 50
      `;

      const result = await this.databaseService.query(query, [vendorId]);
      return result.rows;
    } catch (error) {
      this.logger.error(`Error getting help history: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to get help history');
    }
  }

  /**
   * Save help request to database
   */
  private async saveHelpRequest(data: {
    vendorId: string;
    userQuestion: string;
    aiResponse: string;
    category: string;
    confidenceScore: number;
    isComplianceRelated: boolean;
    conversationContext?: any;
    metadata?: any;
    status: string;
  }): Promise<HelpRequestResponseDto> {
    const query = `
      INSERT INTO help_requests (
        vendor_id, user_question, ai_response, category, confidence_score,
        is_compliance_related, conversation_context, metadata, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING 
        id,
        vendor_id as "vendorId",
        user_question as "userQuestion", 
        ai_response as "aiResponse",
        category,
        confidence_score as "confidenceScore",
        is_compliance_related as "isComplianceRelated",
        conversation_context as "conversationContext",
        metadata,
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const values = [
      data.vendorId,
      data.userQuestion,
      data.aiResponse,
      data.category,
      data.confidenceScore,
      data.isComplianceRelated,
      JSON.stringify(data.conversationContext || {}),
      JSON.stringify(data.metadata || {}),
      data.status,
    ];

    const result = await this.databaseService.query(query, values);
    return result.rows[0];
  }

  /**
   * Get recent conversation history for context
   */
  private async getRecentConversationHistory(
    vendorId: string,
    limit: number = 5,
  ): Promise<any[]> {
    const query = `
      SELECT 
        user_question as "question",
        ai_response as "response",
        category,
        created_at as "createdAt"
      FROM help_requests 
      WHERE vendor_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;

    const result = await this.databaseService.query(query, [vendorId, limit]);
    return result.rows.reverse(); // Return in chronological order
  }

  /**
   * Check if question is compliance-related
   */
  private isComplianceRelated(question: string): boolean {
    const complianceKeywords = [
      'compliance', 'regulation', 'policy', 'procedure', 'audit', 'risk',
      'security', 'privacy', 'gdpr', 'sox', 'iso', 'nist', 'framework',
      'control', 'assessment', 'documentation', 'evidence', 'certification',
      'standard', 'requirement', 'cybersecurity', 'data protection',
      'financial', 'pci', 'hipaa', 'vendor', 'third party', 'due diligence',
      'questionnaire', 'checklist', 'supporting document', 'remediation'
    ];

    const questionLower = question.toLowerCase();
    return complianceKeywords.some(keyword => questionLower.includes(keyword));
  }

  /**
   * Generate follow-up suggestions based on category
   */
  private generateFollowUpSuggestions(category: string): string[] {
    const suggestions = {
      'Data Privacy': [
        'What GDPR documentation do I need?',
        'How do I handle data subject requests?',
        'What are the data retention requirements?'
      ],
      'Cybersecurity': [
        'What security controls should I implement?',
        'How do I conduct a risk assessment?',
        'What incident response procedures are needed?'
      ],
      'Financial Crime Prevention': [
        'What AML controls are required?',
        'How do I screen for sanctions?',
        'What suspicious activity reporting is needed?'
      ],
      'Vendor Risk Management': [
        'How do I assess vendor risks?',
        'What due diligence documentation is required?',
        'How often should I review vendor relationships?'
      ]
    };

    return suggestions[category] || [
      'What compliance frameworks apply to my business?',
      'How do I document my compliance processes?',
      'What evidence do I need for audits?'
    ];
  }
} 