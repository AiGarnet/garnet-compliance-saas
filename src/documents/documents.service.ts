import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { DocumentRelevanceResponseDto } from '../checklists/dto/checklist.dto';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OpenAI API key not configured. Document relevance checking will be disabled.');
    } else {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Extract text content from uploaded document file
   */
  async extractDocumentContent(file: Express.Multer.File): Promise<string> {
    try {
      const mimeType = file.mimetype.toLowerCase();
      
      // Handle text files directly
      if (mimeType === 'text/plain') {
        return file.buffer.toString('utf-8');
      }
      
      // Handle JSON files
      if (mimeType === 'application/json') {
        return JSON.stringify(JSON.parse(file.buffer.toString('utf-8')), null, 2);
      }
      
      // For PDFs, DOCXs, and images - basic content extraction
      // TODO: Implement proper PDF parsing with pdf-parse, DOCX with mammoth, OCR for images
      if (mimeType === 'application/pdf') {
        return await this.extractPdfContent(file);
      }
      
      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await this.extractDocxContent(file);
      }
      
      if (mimeType.startsWith('image/')) {
        return await this.extractImageContent(file);
      }
      
      // For unsupported types, return informative message with supported formats
      const supportedFormats = ['PDF', 'TXT', 'JSON', 'DOCX (limited)', 'Images (planned)'];
      return `Document: ${file.originalname}\nType: ${file.mimetype}\nSize: ${file.size} bytes\n\nThis file type is not currently supported for content extraction.\n\nSupported formats: ${supportedFormats.join(', ')}\n\nPlease convert your document to one of the supported formats and try again.`;
      
    } catch (error) {
      this.logger.error(`Failed to extract content from document: ${error.message}`);
      
      // Provide specific error messages based on file type and error
      if (file.mimetype === 'application/pdf') {
        return `PDF Document: ${file.originalname}\nExtraction failed: This PDF could not be processed. The file may be corrupted, password-protected, or contain only images. Please ensure the PDF contains readable text and try again.`;
      } else if (file.mimetype.includes('word') || file.mimetype.includes('document')) {
        return `Document: ${file.originalname}\nExtraction failed: Unable to process this document. Please convert to PDF or TXT format and try again.`;
      } else {
        return `Document: ${file.originalname}\nExtraction failed: ${error.message}. Please check the file format and try again.`;
      }
    }
  }

  /**
   * Enhanced document relevance checker with comprehensive analysis
   */
  async checkDocumentRelevance(
    questionText: string,
    documentContent: string,
    threshold: number = 0.75
  ): Promise<DocumentRelevanceResponseDto> {
    try {
      // Step 1: Pre-analysis checks
      const preAnalysis = this.performPreAnalysisChecks(questionText, documentContent);
      if (preAnalysis.shouldReject) {
        return {
          relevanceScore: preAnalysis.score,
          isRelevant: false,
          message: preAnalysis.message,
          extractedContent: this.truncateContent(documentContent),
          questionText
        };
      }

      // Step 2: Keyword-based relevance analysis
      const keywordAnalysis = this.performKeywordAnalysis(questionText, documentContent);
      
      // Step 3: AI-powered analysis (if available)
      let aiAnalysis = { score: keywordAnalysis.score, message: keywordAnalysis.message };
      if (this.openai) {
        aiAnalysis = await this.performAIAnalysis(questionText, documentContent);
      }

      // Step 4: Combine analyses for final score
      const finalScore = this.combineAnalysisResults(keywordAnalysis, aiAnalysis);
      const isRelevant = finalScore >= threshold;

      // Step 5: Generate comprehensive message
      const message = this.generateRelevanceMessage(finalScore, isRelevant, keywordAnalysis, aiAnalysis, questionText);

      return {
        relevanceScore: finalScore,
        isRelevant,
        message,
        extractedContent: this.truncateContent(documentContent),
        questionText
      };
      
    } catch (error) {
      this.logger.error(`Failed to check document relevance: ${error.message}`);
      return {
        relevanceScore: 0,
        isRelevant: false,
        message: `❌ Document analysis failed due to technical error. Please try again or contact support.`,
        extractedContent: this.truncateContent(documentContent),
        questionText
      };
    }
  }

  /**
   * Detect if a question requires supporting documents using keyword matching and AI
   */
  async detectDocumentRequirement(questionText: string): Promise<{
    requiresSupportingDocument: boolean;
    confidenceScore: number;
    reason: string;
  }> {
    try {
      // Keyword-based detection
      const keywordResult = this.detectByKeywords(questionText);
      
      // AI-based enhancement if available
      let aiResult = { score: keywordResult.score, reason: 'Keyword analysis only' };
      if (this.openai) {
        aiResult = await this.detectByAI(questionText);
      }
      
      // Combine results - take highest confidence
      const finalScore = Math.max(keywordResult.score, aiResult.score);
      const requiresDoc = finalScore >= 0.6;
      
      return {
        requiresSupportingDocument: requiresDoc,
        confidenceScore: finalScore,
        reason: finalScore === keywordResult.score ? keywordResult.reason : aiResult.reason
      };
      
    } catch (error) {
      this.logger.error(`Failed to detect document requirement: ${error.message}`);
      return {
        requiresSupportingDocument: false,
        confidenceScore: 0,
        reason: `Detection failed: ${error.message}`
      };
    }
  }

  /**
   * Pre-analysis checks for obvious rejections or acceptances
   */
  private performPreAnalysisChecks(questionText: string, documentContent: string): {
    shouldReject: boolean;
    score: number;
    message: string;
  } {
    const content = documentContent.toLowerCase();
    const question = questionText.toLowerCase();

    // Check for empty or too short content
    if (content.trim().length < 10) {
      return {
        shouldReject: true,
        score: 0.05,
        message: '❌ Document rejected: File appears to be empty or contains insufficient content. Please upload a valid document with readable content.'
      };
    }

    // Check for corrupted or unreadable content
    const corruptedIndicators = ['extraction failed', 'content extraction not yet supported', 'failed to extract'];
    if (corruptedIndicators.some(indicator => content.includes(indicator))) {
      return {
        shouldReject: true,
        score: 0.10,
        message: '❌ Document rejected: Unable to read document content. Please ensure the file is not corrupted and is in a supported format (PDF, DOCX, TXT, or image).'
      };
    }

    // Check for placeholder or template content
    const placeholderIndicators = ['lorem ipsum', '[placeholder]', '[insert text]', 'sample document', 'template document'];
    if (placeholderIndicators.some(indicator => content.includes(indicator))) {
      return {
        shouldReject: true,
        score: 0.15,
        message: '❌ Document rejected: This appears to be a template or placeholder document. Please upload your actual, completed document.'
      };
    }

    // Check for wrong document type (if question is very specific)
    const questionTypes = this.identifyQuestionType(question);
    const documentType = this.identifyDocumentType(content);
    
    if (questionTypes.length > 0 && documentType && !questionTypes.includes(documentType)) {
      const expectedTypes = questionTypes.join(' or ');
      return {
        shouldReject: true,
        score: 0.20,
        message: `❌ Document rejected: This question requires a ${expectedTypes}, but the uploaded document appears to be a ${documentType}. Please upload the correct document type.`
      };
    }

    return { shouldReject: false, score: 0, message: '' };
  }

  /**
   * Keyword-based relevance analysis
   */
  private performKeywordAnalysis(questionText: string, documentContent: string): {
    score: number;
    message: string;
    matchedKeywords: string[];
  } {
    const question = questionText.toLowerCase();
    const content = documentContent.toLowerCase();

    // Extract key terms from question
    const questionKeywords = this.extractKeyTerms(question);
    const documentKeywords = this.extractKeyTerms(content);

    // Calculate keyword overlap
    const matchedKeywords = questionKeywords.filter(keyword => 
      documentKeywords.some(docKeyword => 
        docKeyword.includes(keyword) || keyword.includes(docKeyword)
      )
    );

    const keywordScore = matchedKeywords.length / Math.max(questionKeywords.length, 1);

    // Bonus for exact phrase matches
    const exactMatches = questionKeywords.filter(keyword => content.includes(keyword));
    const exactMatchBonus = exactMatches.length * 0.1;

    const finalScore = Math.min(keywordScore + exactMatchBonus, 1.0);

    return {
      score: finalScore,
      message: `Keyword analysis: ${matchedKeywords.length}/${questionKeywords.length} terms matched`,
      matchedKeywords
    };
  }

  /**
   * AI-powered relevance analysis
   */
  private async performAIAnalysis(questionText: string, documentContent: string): Promise<{
    score: number;
    message: string;
  }> {
    try {
      const prompt = this.buildEnhancedRelevancePrompt(questionText, documentContent);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 600
      });

      const response = completion.choices[0].message.content || '';
      return this.parseEnhancedRelevanceResponse(response);
      
    } catch (error) {
      this.logger.warn(`AI analysis failed: ${error.message}`);
      return {
        score: 0.5,
        message: 'AI analysis unavailable, using keyword-based analysis only'
      };
    }
  }

  /**
   * Combine keyword and AI analysis results
   */
  private combineAnalysisResults(
    keywordAnalysis: { score: number },
    aiAnalysis: { score: number }
  ): number {
    // Weighted combination: 40% keyword analysis, 60% AI analysis
    return (keywordAnalysis.score * 0.4) + (aiAnalysis.score * 0.6);
  }

  /**
   * Generate comprehensive relevance message
   */
  private generateRelevanceMessage(
    finalScore: number,
    isRelevant: boolean,
    keywordAnalysis: any,
    aiAnalysis: any,
    questionText: string
  ): string {
    if (isRelevant) {
      if (finalScore >= 0.9) {
        return `✅ Document accepted: Excellent match! The document strongly corresponds to the question requirements. (Confidence: ${Math.round(finalScore * 100)}%)`;
      } else if (finalScore >= 0.8) {
        return `✅ Document accepted: Good match. The document appears to address the question requirements adequately. (Confidence: ${Math.round(finalScore * 100)}%)`;
      } else {
        return `✅ Document accepted: Acceptable match. The document seems relevant but may not fully address all aspects of the question. (Confidence: ${Math.round(finalScore * 100)}%)`;
      }
    } else {
      if (finalScore < 0.3) {
        return `❌ Document rejected: Poor match. The document does not appear to be relevant to the question. Please upload a document that directly addresses: "${questionText.substring(0, 100)}${questionText.length > 100 ? '...' : ''}"`;
      } else if (finalScore < 0.5) {
        return `❌ Document rejected: Weak relevance. While there may be some connection, the document doesn't sufficiently address the question requirements. Please review the question and upload a more appropriate document.`;
      } else {
        return `❌ Document rejected: Below threshold. The document shows some relevance but doesn't meet the required confidence level (${Math.round(finalScore * 100)}% vs 75% required). Please upload a more specific document.`;
      }
    }
  }

  /**
   * Identify question type based on keywords
   */
  private identifyQuestionType(question: string): string[] {
    const types: string[] = [];
    
    if (question.includes('license') || question.includes('permit')) types.push('license');
    if (question.includes('certificate') || question.includes('certification')) types.push('certificate');
    if (question.includes('insurance') || question.includes('policy')) types.push('insurance policy');
    if (question.includes('contract') || question.includes('agreement')) types.push('contract');
    if (question.includes('tax') || question.includes('w9') || question.includes('w8')) types.push('tax document');
    if (question.includes('financial') || question.includes('statement')) types.push('financial statement');
    if (question.includes('audit') || question.includes('report')) types.push('audit report');
    
    return types;
  }

  /**
   * Identify document type from content
   */
  private identifyDocumentType(content: string): string | null {
    if (content.includes('license') && content.includes('issued')) return 'license';
    if (content.includes('certificate') && content.includes('certif')) return 'certificate';
    if (content.includes('policy') && (content.includes('insurance') || content.includes('coverage'))) return 'insurance policy';
    if (content.includes('agreement') || content.includes('contract')) return 'contract';
    if (content.includes('tax') || content.includes('irs') || content.includes('ein')) return 'tax document';
    if (content.includes('statement') && content.includes('financial')) return 'financial statement';
    if (content.includes('audit') && content.includes('report')) return 'audit report';
    
    return null;
  }

  /**
   * Extract key terms from text
   */
  private extractKeyTerms(text: string): string[] {
    // Remove common words and extract meaningful terms
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'your', 'you', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
    
    return text
      .split(/\s+/)
      .map(word => word.replace(/[^\w]/g, '').toLowerCase())
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates
  }

  /**
   * Truncate content for response
   */
  private truncateContent(content: string): string {
    return content.length > 500 ? content.substring(0, 500) + '...' : content;
  }

  /**
   * Build enhanced relevance analysis prompt
   */
  private buildEnhancedRelevancePrompt(questionText: string, documentContent: string): string {
    return `
You are a document relevance analyzer for a vendor onboarding platform. Analyze how well the provided document answers or addresses the given question.

QUESTION: "${questionText}"

DOCUMENT CONTENT: "${documentContent.substring(0, 2000)}"

Evaluate the document based on these criteria:
1. Content Relevance (40%): Does the document contain information that directly answers the question?
2. Document Type Match (30%): Is this the type of document typically expected for this question?
3. Completeness (20%): Does the document provide sufficient detail to satisfy the question requirements?
4. Authenticity (10%): Does the document appear to be genuine (not a template, sample, or placeholder)?

Provide your analysis in this exact format:
RELEVANCE_SCORE: [0.0 to 1.0]
REASONING: [Brief explanation of your assessment]
RECOMMENDATIONS: [If score < 0.75, suggest what type of document would be better]

Be strict in your evaluation. A score of 0.75+ means the document adequately addresses the question.
    `;
  }

  /**
   * Parse enhanced AI relevance response
   */
  private parseEnhancedRelevanceResponse(response: string): { score: number; message: string } {
    try {
      const scoreMatch = response.match(/RELEVANCE_SCORE:\s*([0-9.]+)/i);
      const reasoningMatch = response.match(/REASONING:\s*([^\n]+)/i);
      const recommendationsMatch = response.match(/RECOMMENDATIONS:\s*([^\n]+)/i);

      const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0.5;
      const reasoning = reasoningMatch ? reasoningMatch[1].trim() : 'Analysis completed';
      const recommendations = recommendationsMatch ? recommendationsMatch[1].trim() : '';

      let message = `AI Analysis: ${reasoning}`;
      if (recommendations && score < 0.75) {
        message += ` Recommendation: ${recommendations}`;
      }

      return {
        score: Math.max(0, Math.min(1, score)),
        message
      };
    } catch (error) {
      this.logger.warn(`Failed to parse AI response: ${error.message}`);
      return {
        score: 0.5,
        message: 'AI analysis completed with basic parsing'
      };
    }
  }

  private detectByKeywords(questionText: string): { score: number; reason: string } {
    const text = questionText.toLowerCase();
    
    // High confidence keywords
    const highConfidenceKeywords = [
      'upload', 'provide document', 'attach', 'submit document',
      'certificate', 'proof', 'evidence', 'documentation',
      'copy of', 'scan of', 'file showing'
    ];
    
    // Medium confidence keywords
    const mediumConfidenceKeywords = [
      'provide', 'show', 'demonstrate', 'confirm',
      'policy', 'procedure', 'report', 'audit',
      'contract', 'agreement', 'license', 'permit'
    ];
    
    // Low confidence keywords
    const lowConfidenceKeywords = [
      'describe', 'list', 'detail', 'explain',
      'process', 'system', 'method'
    ];

    for (const keyword of highConfidenceKeywords) {
      if (text.includes(keyword)) {
        return { 
          score: 0.9, 
          reason: `High confidence - contains keyword: "${keyword}"` 
        };
      }
    }

    for (const keyword of mediumConfidenceKeywords) {
      if (text.includes(keyword)) {
        return { 
          score: 0.7, 
          reason: `Medium confidence - contains keyword: "${keyword}"` 
        };
      }
    }

    for (const keyword of lowConfidenceKeywords) {
      if (text.includes(keyword)) {
        return { 
          score: 0.3, 
          reason: `Low confidence - contains keyword: "${keyword}"` 
        };
      }
    }

    return { 
      score: 0.1, 
      reason: 'No document-related keywords detected' 
    };
  }

  private async detectByAI(questionText: string): Promise<{ score: number; reason: string }> {
    try {
      const prompt = `Analyze this compliance question and determine if it requires a supporting document to be uploaded.

Question: "${questionText}"

Consider:
- Does the question ask for evidence, proof, or documentation?
- Would answering require showing a certificate, policy, report, or similar document?
- Is this asking for a description/explanation that could be answered with text only?

Respond with a JSON object:
{
  "requiresDocument": boolean,
  "confidence": number (0.0 to 1.0),
  "reasoning": "Brief explanation"
}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 200
      });

      const response = completion.choices[0].message.content || '';
      const analysis = JSON.parse(response);
      
      return {
        score: analysis.requiresDocument ? analysis.confidence : (1 - analysis.confidence),
        reason: `AI analysis: ${analysis.reasoning}`
      };
      
    } catch (error) {
      this.logger.error(`AI document detection failed: ${error.message}`);
      return { score: 0.5, reason: 'AI analysis failed' };
    }
  }

  private buildRelevancePrompt(questionText: string, documentContent: string): string {
    return `Analyze the relevance between this compliance question and the provided document content.

Question: "${questionText}"

Document Content:
"${documentContent.substring(0, 2000)}${documentContent.length > 2000 ? '...' : ''}"

Rate the relevance on a scale of 0.0 to 1.0 where:
- 1.0 = Highly relevant, document directly answers or supports the question
- 0.7-0.9 = Relevant, document provides useful information for the question
- 0.4-0.6 = Somewhat relevant, document touches on related topics
- 0.1-0.3 = Barely relevant, minimal connection to the question
- 0.0 = Not relevant, document is unrelated to the question

Respond with a JSON object:
{
  "relevanceScore": number (0.0 to 1.0),
  "explanation": "Brief explanation of the relevance assessment"
}`;
  }

  private parseRelevanceResponse(response: string): { score: number; message: string } {
    try {
      const analysis = JSON.parse(response);
      return {
        score: Math.max(0, Math.min(1, analysis.relevanceScore || 0)),
        message: analysis.explanation || 'Relevance analysis completed'
      };
    } catch (error) {
      // Fallback parsing for non-JSON responses
      const scoreMatch = response.match(/(\d+\.?\d*)/);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0.5;
      return {
        score: Math.max(0, Math.min(1, score)),
        message: 'Relevance analysis completed (fallback parsing)'
      };
    }
  }

  private async extractPdfContent(file: Express.Multer.File): Promise<string> {
    try {
      this.logger.log(`Extracting content from PDF: ${file.originalname}`);
      
      // Use pdf-parse to extract text content from the PDF
      const pdfData = await pdfParse(file.buffer);
      
      if (!pdfData.text || pdfData.text.trim().length === 0) {
        this.logger.warn(`PDF ${file.originalname} appears to be empty or contains no extractable text`);
        return `PDF Document: ${file.originalname}\nSize: ${file.size} bytes\nPages: ${pdfData.numpages || 'Unknown'}\n\nThis PDF appears to contain no readable text content. It may be an image-based PDF, encrypted, or corrupted. Please ensure the document contains text and try uploading again.`;
      }
      
      // Clean up the extracted text
      const cleanedText = pdfData.text
        .replace(/\r\n/g, '\n')  // Normalize line endings
        .replace(/\n\s*\n/g, '\n')  // Remove multiple consecutive newlines
        .trim();
      
      this.logger.log(`Successfully extracted ${cleanedText.length} characters from PDF: ${file.originalname}`);
      
      return `PDF Document: ${file.originalname}\nSize: ${file.size} bytes\nPages: ${pdfData.numpages || 'Unknown'}\n\nExtracted Content:\n${cleanedText}`;
      
    } catch (error) {
      this.logger.error(`Failed to extract content from PDF ${file.originalname}: ${error.message}`, error.stack);
      
      // Provide specific error messages based on the error type
      if (error.message.includes('Invalid PDF')) {
        return `PDF Document: ${file.originalname}\nError: This file appears to be corrupted or is not a valid PDF. Please check the file and try uploading again.`;
      } else if (error.message.includes('Encrypted')) {
        return `PDF Document: ${file.originalname}\nError: This PDF is password-protected. Please remove the password protection and try uploading again.`;
      } else {
        return `PDF Document: ${file.originalname}\nError: Unable to extract content from this PDF. The file may be corrupted, encrypted, or contain only images. Error details: ${error.message}`;
      }
    }
  }

  private async extractDocxContent(file: Express.Multer.File): Promise<string> {
    // TODO: Implement DOCX parsing with mammoth library
    // For now, return placeholder
    return `DOCX Document: ${file.originalname}\nSize: ${file.size} bytes\n[DOCX content extraction will be implemented with mammoth library]`;
  }

  private async extractImageContent(file: Express.Multer.File): Promise<string> {
    // TODO: Implement OCR with Tesseract.js or similar
    // For now, return placeholder
    return `Image Document: ${file.originalname}\nSize: ${file.size} bytes\n[OCR content extraction will be implemented with Tesseract.js]`;
  }
} 