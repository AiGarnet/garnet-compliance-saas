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

      // Step 2: Check if content is structured JSON (from PDF parsing)
      let contentForAnalysis = documentContent;
      let structuredData = null;
      
      try {
        const parsedContent = JSON.parse(documentContent);
        if (parsedContent.document && parsedContent.content) {
          // This is structured PDF content
          structuredData = parsedContent;
          contentForAnalysis = this.extractAnalysisTextFromStructuredContent(parsedContent);
          this.logger.log('Using structured PDF content for enhanced relevance analysis');
        }
      } catch (e) {
        // Not JSON, use content as-is
        this.logger.log('Using raw text content for relevance analysis');
      }

      // Step 3: Enhanced keyword-based relevance analysis
      const keywordAnalysis = structuredData 
        ? this.performEnhancedKeywordAnalysis(questionText, structuredData)
        : this.performKeywordAnalysis(questionText, contentForAnalysis);
      
      // Step 4: AI-powered analysis (if available)
      let aiAnalysis = { score: keywordAnalysis.score, message: keywordAnalysis.message };
      if (this.openai) {
        aiAnalysis = await this.performEnhancedAIAnalysis(questionText, contentForAnalysis, structuredData);
      }

      // Step 5: Combine analyses for final score with enhanced weighting for structured content
      const finalScore = this.combineEnhancedAnalysisResults(keywordAnalysis, aiAnalysis, structuredData);
      const isRelevant = finalScore >= threshold;

      // Step 6: Generate comprehensive message with structured insights
      const message = this.generateEnhancedRelevanceMessage(
        finalScore, 
        isRelevant, 
        keywordAnalysis, 
        aiAnalysis, 
        questionText, 
        structuredData
      );

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
        message: `Document analysis failed due to technical error. Please try again or contact support.`,
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
   * Pre-analysis checks for document quality and basic relevance
   */
  private performPreAnalysisChecks(question: string, content: string): {
    shouldReject: boolean;
    score: number;
    message: string;
  } {
    const lowerContent = content.toLowerCase();
    const lowerQuestion = question.toLowerCase();

    // Check for placeholder or template content
    const placeholderIndicators = ['lorem ipsum', '[placeholder]', '[insert text]', 'sample document', 'template document'];
    const placeholderFound = placeholderIndicators.find(indicator => lowerContent.includes(indicator));
    
    if (placeholderFound) {
      return {
        shouldReject: true,
        score: this.calculatePlaceholderScore(content, placeholderFound),
        message: '❌ Document rejected: This appears to be a template or placeholder document. Please upload your actual, completed document.'
      };
    }

    // Check for wrong document type (if question is very specific)
    const questionTypes = this.identifyQuestionType(question);
    const documentType = this.identifyDocumentType(content);
    
    if (questionTypes.length > 0 && documentType && !questionTypes.includes(documentType)) {
      const expectedTypes = questionTypes.join(' or ');
      const mismatchScore = this.calculateTypeMismatchScore(questionTypes, documentType, content);
      
      return {
        shouldReject: true,
        score: mismatchScore,
        message: `❌ Document rejected: This question requires a ${expectedTypes}, but the uploaded document appears to be a ${documentType}. Please upload the correct document type.`
      };
    }

    return { shouldReject: false, score: 0, message: '' };
  }

  /**
   * Calculate score for placeholder/template documents based on content quality
   */
  private calculatePlaceholderScore(content: string, placeholderType: string): number {
    const contentLength = content.length;
    const wordCount = content.split(/\s+/).length;
    
    // Very short placeholder documents get very low scores
    if (contentLength < 100 || wordCount < 20) {
      return 0.05;
    }
    
    // Longer documents with some real content but still templates get slightly higher scores
    if (contentLength > 500 && wordCount > 100) {
      return 0.15;
    }
    
    // Default for templates/placeholders
    return 0.10;
  }

  /**
   * Calculate score for document type mismatches based on severity
   */
  private calculateTypeMismatchScore(expectedTypes: string[], actualType: string, content: string): number {
    const contentLength = content.length;
    const hasSubstantialContent = contentLength > 1000;
    
    // Check if it's a complete mismatch (e.g., expecting policy but got invoice)
    const criticalMismatch = this.isCriticalTypeMismatch(expectedTypes, actualType);
    
    if (criticalMismatch) {
      // Even substantial content gets low score if completely wrong type
      return hasSubstantialContent ? 0.25 : 0.15;
    }
    
    // Partial mismatches (e.g., expecting audit report but got security report)
    const partialMatch = this.isPartialTypeMatch(expectedTypes, actualType);
    
    if (partialMatch) {
      // These can get better scores if content is substantial
      return hasSubstantialContent ? 0.45 : 0.30;
    }
    
    // Default mismatch score
    return hasSubstantialContent ? 0.35 : 0.20;
  }

  /**
   * Check if document type mismatch is critical (completely unrelated)
   */
  private isCriticalTypeMismatch(expectedTypes: string[], actualType: string): boolean {
    const criticalMismatches = {
      'policy': ['invoice', 'receipt', 'certificate', 'license'],
      'certificate': ['policy', 'invoice', 'report', 'procedure'],
      'report': ['invoice', 'certificate', 'license'],
      'procedure': ['invoice', 'certificate', 'license'],
      'audit': ['invoice', 'certificate', 'license'],
      'contract': ['invoice', 'certificate', 'policy'],
    };
    
    return expectedTypes.some(expected => 
      criticalMismatches[expected]?.includes(actualType)
    );
  }

  /**
   * Check if there's a partial match between expected and actual document types
   */
  private isPartialTypeMatch(expectedTypes: string[], actualType: string): boolean {
    const partialMatches = {
      'policy': ['procedure', 'guideline', 'standard'],
      'report': ['audit', 'assessment', 'analysis'],
      'certificate': ['license', 'permit', 'accreditation'],
      'procedure': ['policy', 'guideline', 'process'],
    };
    
    return expectedTypes.some(expected => 
      partialMatches[expected]?.includes(actualType) ||
      actualType.includes(expected) ||
      expected.includes(actualType)
    );
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
   * Build enhanced relevance analysis prompt
   */
  private buildEnhancedRelevancePrompt(questionText: string, documentContent: string, structuredData?: any): string {
    let basePrompt = `
You are a document relevance analyzer for a vendor onboarding platform. Analyze how well the provided document answers or addresses the given question.

QUESTION: "${questionText}"

DOCUMENT CONTENT: "${documentContent.substring(0, 2000)}"`;

    // Add structured data analysis if available
    if (structuredData) {
      basePrompt += `

STRUCTURED DOCUMENT ANALYSIS:`;
      
      if (structuredData.document) {
        basePrompt += `
- Document Type: ${structuredData.document.type || 'unknown'}
- Filename: ${structuredData.document.filename}
- Pages: ${structuredData.document.pages || 0}`;
      }
      
      if (structuredData.analysis) {
        basePrompt += `
- Detected Document Category: ${structuredData.analysis.document_type}
- Compliance Keywords Found: ${structuredData.analysis.compliance_keywords?.join(', ') || 'none'}
- Has Structured Data: ${structuredData.analysis.has_structured_data ? 'Yes' : 'No'}
- Has Dates: ${structuredData.analysis.has_dates ? 'Yes' : 'No'}
- Has Contact Information: ${structuredData.analysis.has_contact_info ? 'Yes' : 'No'}`;
      }
      
      if (structuredData.summary) {
        basePrompt += `
- Document Purpose: ${structuredData.summary.document_purpose || 'unknown'}
- Key Topics: ${structuredData.summary.key_topics?.join(', ') || 'none identified'}`;
      }
      
      if (structuredData.structure && structuredData.structure.key_value_pairs && structuredData.structure.key_value_pairs.length > 0) {
        const kvSample = structuredData.structure.key_value_pairs.slice(0, 3)
          .map(pair => `${pair.key}: ${pair.value}`)
          .join(', ');
        basePrompt += `
- Key Information Available: ${kvSample}`;
      }
    }

    basePrompt += `

Evaluate the document based on these criteria:
1. Content Relevance (40%): Does the document contain information that directly answers the question?
2. Document Type Match (30%): Is this the type of document typically expected for this question?
3. Completeness (20%): Does the document provide sufficient detail to satisfy the question requirements?
4. Authenticity (10%): Does the document appear to be genuine (not a template, sample, or placeholder)?

${structuredData ? 'ENHANCED ANALYSIS: Use the structured data above to provide more accurate scoring. Pay special attention to document type matching and compliance keyword relevance.' : ''}

Provide your analysis in this exact format:
RELEVANCE_SCORE: [0.0 to 1.0]
REASONING: [Brief explanation of your assessment]
RECOMMENDATIONS: [If score < 0.75, suggest what type of document would be better]

Be strict in your evaluation. A score of 0.75+ means the document adequately addresses the question.
    `;
    
    return basePrompt;
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
      
      // Parse PDF content into structured JSON for better analysis
      const structuredContent = this.parsePdfContentToJson(cleanedText, pdfData, file);
      
      this.logger.log(`Successfully extracted and structured ${cleanedText.length} characters from PDF: ${file.originalname}`);
      
      // Return structured JSON content instead of raw text
      return JSON.stringify(structuredContent, null, 2);
      
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

  /**
   * Parse PDF content into structured JSON format for better relevance analysis
   */
  private parsePdfContentToJson(text: string, pdfData: any, file: Express.Multer.File): any {
    try {
      // Split text into sections and analyze structure
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      
      // Identify different types of content
      const headers = lines.filter(line => 
        line.trim().length < 100 && 
        (line.match(/^[A-Z\s]+$/) || line.includes(':') || line.match(/^\d+\./))
      );
      
      const paragraphs = lines.filter(line => 
        line.trim().length > 50 && 
        !line.match(/^[A-Z\s]+$/) && 
        !line.includes('Page') && 
        !line.match(/^\d+\./)
      );
      
      // Extract potential key-value pairs
      const keyValuePairs = lines.filter(line => 
        line.includes(':') && 
        line.split(':').length === 2
      ).map(line => {
        const [key, value] = line.split(':');
        return { key: key.trim(), value: value.trim() };
      });
      
      // Extract dates, numbers, and other structured data
      const dates = text.match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b|\b[A-Za-z]+ \d{1,2}, \d{4}\b/g) || [];
      const numbers = text.match(/\b\d{1,3}(,\d{3})*(\.\d+)?\b/g) || [];
      const emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [];
      const urls = text.match(/https?:\/\/[^\s]+/g) || [];
      
      // Categorize content based on common document types
      const documentType = this.identifyDocumentType(text, headers);
      
      // Extract technical terms and compliance-related keywords
      const complianceKeywords = this.extractComplianceKeywords(text);
      
      return {
        document: {
          filename: file.originalname,
          size: file.size,
          pages: pdfData.numpages || 0,
          type: documentType,
          extractedAt: new Date().toISOString()
        },
        content: {
          raw_text: text,
          total_characters: text.length,
          total_words: text.split(/\s+/).length,
          total_lines: lines.length
        },
        structure: {
          headers: headers.slice(0, 20), // Limit to prevent overflow
          paragraphs: paragraphs.slice(0, 10), // Limit to prevent overflow
          key_value_pairs: keyValuePairs.slice(0, 15)
        },
        extracted_data: {
          dates: dates.slice(0, 10),
          numbers: numbers.slice(0, 20),
          emails: emails.slice(0, 10),
          urls: urls.slice(0, 10)
        },
        analysis: {
          document_type: documentType,
          compliance_keywords: complianceKeywords,
          has_structured_data: keyValuePairs.length > 0,
          has_dates: dates.length > 0,
          has_contact_info: emails.length > 0 || urls.length > 0,
          readability_score: this.calculateReadabilityScore(text)
        },
        summary: {
          first_paragraph: paragraphs[0] || '',
          key_topics: this.extractKeyTopics(text),
          document_purpose: this.inferDocumentPurpose(text, headers)
        }
      };
    } catch (error) {
      this.logger.warn(`Failed to parse PDF content to JSON: ${error.message}`);
      // Fallback to basic structure
      return {
        document: {
          filename: file.originalname,
          size: file.size,
          type: 'unknown',
          extractedAt: new Date().toISOString()
        },
        content: {
          raw_text: text,
          total_characters: text.length
        },
        error: `Failed to parse content: ${error.message}`
      };
    }
  }

  /**
   * Extract compliance-related keywords for better relevance matching
   */
  private extractComplianceKeywords(text: string): string[] {
    const complianceTerms = [
      'gdpr', 'hipaa', 'sox', 'pci dss', 'iso 27001', 'nist', 'compliance',
      'audit', 'security', 'privacy', 'data protection', 'encryption',
      'access control', 'risk assessment', 'vulnerability', 'incident response',
      'business continuity', 'disaster recovery', 'backup', 'monitoring',
      'training', 'awareness', 'policy', 'procedure', 'documentation',
      'certification', 'attestation', 'validation', 'verification'
    ];
    
    const textLower = text.toLowerCase();
    return complianceTerms.filter(term => textLower.includes(term));
  }

  /**
   * Extract key topics from the document
   */
  private extractKeyTopics(text: string): string[] {
    // Simple keyword extraction based on frequency
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
      if (!['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'said', 'each', 'which', 'their', 'time', 'into', 'only', 'more', 'very', 'what', 'know', 'just', 'first', 'could', 'over', 'think', 'also', 'back', 'after', 'come', 'year', 'good', 'work', 'much', 'before', 'right', 'should', 'where', 'does', 'being', 'here', 'through', 'most', 'made', 'well', 'make', 'when', 'same', 'take', 'there', 'between', 'would', 'these'].includes(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });
    
    return Object.entries(frequency)
      .filter(([word, count]) => count > 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Infer document purpose from content
   */
  private inferDocumentPurpose(text: string, headers: string[]): string {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('evidence') || textLower.includes('proof')) {
      return 'evidence_documentation';
    } else if (textLower.includes('guide') || textLower.includes('manual')) {
      return 'instructional_guide';
    } else if (textLower.includes('report') || textLower.includes('findings')) {
      return 'reporting_document';
    } else if (textLower.includes('plan') || textLower.includes('strategy')) {
      return 'planning_document';
    } else {
      return 'informational_document';
    }
  }

  /**
   * Calculate simple readability score
   */
  private calculateReadabilityScore(text: string): number {
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const characters = text.length;
    
    if (sentences === 0 || words === 0) return 0;
    
    // Simple readability score (lower is better)
    const avgWordsPerSentence = words / sentences;
    const avgCharsPerWord = characters / words;
    
    return Math.round((avgWordsPerSentence + avgCharsPerWord) * 10) / 10;
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

  /**
   * Extract analysis text from structured PDF content
   */
  private extractAnalysisTextFromStructuredContent(structuredData: any): string {
    const parts = [];
    
    // Add document metadata
    if (structuredData.document) {
      parts.push(`Document: ${structuredData.document.filename}`);
      parts.push(`Type: ${structuredData.document.type || 'unknown'}`);
    }
    
    // Add summary information
    if (structuredData.summary) {
      if (structuredData.summary.document_purpose) {
        parts.push(`Purpose: ${structuredData.summary.document_purpose}`);
      }
      if (structuredData.summary.key_topics && structuredData.summary.key_topics.length > 0) {
        parts.push(`Key Topics: ${structuredData.summary.key_topics.join(', ')}`);
      }
      if (structuredData.summary.first_paragraph) {
        parts.push(`Summary: ${structuredData.summary.first_paragraph}`);
      }
    }
    
    // Add compliance keywords
    if (structuredData.analysis && structuredData.analysis.compliance_keywords) {
      parts.push(`Compliance Terms: ${structuredData.analysis.compliance_keywords.join(', ')}`);
    }
    
    // Add headers and key-value pairs
    if (structuredData.structure) {
      if (structuredData.structure.headers && structuredData.structure.headers.length > 0) {
        parts.push(`Headers: ${structuredData.structure.headers.slice(0, 5).join(', ')}`);
      }
      if (structuredData.structure.key_value_pairs && structuredData.structure.key_value_pairs.length > 0) {
        const kvPairs = structuredData.structure.key_value_pairs.slice(0, 5)
          .map(pair => `${pair.key}: ${pair.value}`)
          .join(', ');
        parts.push(`Key Information: ${kvPairs}`);
      }
    }
    
    // Add raw text as fallback
    if (structuredData.content && structuredData.content.raw_text) {
      parts.push(`Content: ${structuredData.content.raw_text.substring(0, 1000)}`);
    }
    
    return parts.join('\n');
  }

  /**
   * Enhanced keyword analysis for structured content
   */
  private performEnhancedKeywordAnalysis(questionText: string, structuredData: any): any {
    const question = questionText.toLowerCase();
    let score = 0;
    let matchedTerms = [];
    let analysisDetails = [];

    // Enhanced scoring based on structured data
    if (structuredData.analysis) {
      // Check document type relevance with improved matching
      const docType = structuredData.analysis.document_type;
      if (docType) {
        if (question.includes('policy') && docType.includes('policy')) score += 0.4;
        if (question.includes('audit') && docType.includes('audit')) score += 0.4;
        if (question.includes('certificate') && docType.includes('certificate')) score += 0.4;
        if (question.includes('security') && docType.includes('security')) score += 0.3;
        if (question.includes('training') && docType.includes('training')) score += 0.4;
        if (question.includes('compliance') && docType.includes('compliance')) score += 0.3;
        
        analysisDetails.push(`Document type: ${docType}`);
      }

      // Check compliance keywords with improved weighting
      if (structuredData.analysis.compliance_keywords) {
        const complianceMatches = structuredData.analysis.compliance_keywords.filter(keyword => 
          question.includes(keyword.toLowerCase())
        );
        if (complianceMatches.length > 0) {
          score += Math.min(complianceMatches.length * 0.1, 0.3);
          matchedTerms.push(...complianceMatches);
          analysisDetails.push(`Compliance keywords matched: ${complianceMatches.join(', ')}`);
        }
      }
    }

    // Check key topics for additional relevance
    if (structuredData.summary && structuredData.summary.key_topics) {
      const topicMatches = structuredData.summary.key_topics.filter(topic => 
        question.includes(topic.toLowerCase())
      );
      if (topicMatches.length > 0) {
        score += Math.min(topicMatches.length * 0.05, 0.2);
        matchedTerms.push(...topicMatches);
        analysisDetails.push(`Key topics matched: ${topicMatches.join(', ')}`);
      }
    }

    // Check for direct content matches in the raw text
    if (structuredData.content && structuredData.content.raw_text) {
      const rawText = structuredData.content.raw_text.toLowerCase();
      const questionWords = question.split(' ').filter(word => word.length > 3);
      let contentMatches = 0;
      
      questionWords.forEach(word => {
        if (rawText.includes(word)) {
          contentMatches++;
        }
      });
      
      if (contentMatches > 0) {
        const contentScore = Math.min((contentMatches / questionWords.length) * 0.2, 0.2);
        score += contentScore;
        if (contentScore > 0.1) {
          analysisDetails.push(`Strong content match: ${contentMatches}/${questionWords.length} key words found`);
        }
      }
    }

    // Check structured data elements
    if (structuredData.structure && structuredData.structure.key_value_pairs) {
      const kvMatches = structuredData.structure.key_value_pairs.filter(pair => 
        question.includes(pair.key.toLowerCase()) || question.includes(pair.value.toLowerCase())
      );
      if (kvMatches.length > 0) {
        score += Math.min(kvMatches.length * 0.03, 0.15);
        analysisDetails.push(`Structured data matched: ${kvMatches.length} key-value pairs`);
      }
    }

    // Fallback to traditional keyword analysis on raw text
    if (score < 0.3 && structuredData.content && structuredData.content.raw_text) {
      const traditionalAnalysis = this.performKeywordAnalysis(questionText, structuredData.content.raw_text);
      score = Math.max(score, traditionalAnalysis.score * 0.8); // Slightly reduce traditional score
      if (traditionalAnalysis.score > 0.3) {
        analysisDetails.push('Traditional text analysis provided additional relevance');
      }
    }

    const message = analysisDetails.length > 0 
      ? `Enhanced analysis: ${analysisDetails.join('; ')}`
      : 'Standard keyword analysis performed';

    return {
      score: Math.min(score, 1.0),
      matchedTerms,
      message,
      analysisType: 'enhanced_structured'
    };
  }

  /**
   * Enhanced AI analysis for structured content
   */
  private async performEnhancedAIAnalysis(questionText: string, contentForAnalysis: string, structuredData: any): Promise<any> {
    try {
      if (!this.openai) {
        return this.performKeywordAnalysis(questionText, contentForAnalysis);
      }

      const prompt = this.buildEnhancedRelevancePrompt(questionText, contentForAnalysis, structuredData);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500,
      });

      const aiResponse = response.choices[0]?.message?.content || '';
      
      // Parse AI response
      const scoreMatch = aiResponse.match(/RELEVANCE_SCORE:\s*([0-9.]+)/);
      const reasoningMatch = aiResponse.match(/REASONING:\s*(.+?)(?=RECOMMENDATIONS:|$)/s);
      const recommendationsMatch = aiResponse.match(/RECOMMENDATIONS:\s*(.+)/s);
      
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0.5;
      const reasoning = reasoningMatch ? reasoningMatch[1].trim() : 'AI analysis completed';
      const recommendations = recommendationsMatch ? recommendationsMatch[1].trim() : '';

      return {
        score: Math.max(0, Math.min(1, score)),
        message: reasoning,
        recommendations,
        analysisType: 'enhanced_ai'
      };

    } catch (error) {
      this.logger.warn(`Enhanced AI analysis failed: ${error.message}`);
      return this.performEnhancedKeywordAnalysis(questionText, structuredData);
    }
  }

  /**
   * Combine analysis results with enhanced weighting for structured content
   */
  private combineEnhancedAnalysisResults(keywordAnalysis: any, aiAnalysis: any, structuredData: any): number {
    let finalScore = 0;
    
    if (structuredData) {
      // Enhanced weighting for structured content
      const keywordWeight = 0.4;
      const aiWeight = 0.6;
      
      finalScore = (keywordAnalysis.score * keywordWeight) + (aiAnalysis.score * aiWeight);
      
      // Bonus for having structured data
      if (structuredData.analysis && structuredData.analysis.compliance_keywords && 
          structuredData.analysis.compliance_keywords.length > 0) {
        finalScore += 0.05; // Small bonus for compliance-rich documents
      }
      
      // Bonus for document type matching
      if (structuredData.analysis && structuredData.analysis.document_type && 
          structuredData.analysis.document_type !== 'general_document') {
        finalScore += 0.03; // Small bonus for categorized documents
      }
      
    } else {
      // Standard weighting for non-structured content
      const keywordWeight = 0.3;
      const aiWeight = 0.7;
      
      finalScore = (keywordAnalysis.score * keywordWeight) + (aiAnalysis.score * aiWeight);
    }
    
    return Math.max(0, Math.min(1, finalScore));
  }

  /**
   * Generate enhanced relevance message with structured insights
   */
  private generateEnhancedRelevanceMessage(
    score: number, 
    isRelevant: boolean, 
    keywordAnalysis: any, 
    aiAnalysis: any, 
    questionText: string, 
    structuredData: any
  ): string {
    const messages = [];
    
    if (isRelevant) {
      messages.push('✅ Document appears relevant to the question.');
      
      if (structuredData) {
        if (structuredData.document && structuredData.document.type) {
          messages.push(`📄 Document type: ${structuredData.document.type.replace('_', ' ')}`);
        }
        
        if (structuredData.analysis && structuredData.analysis.compliance_keywords && 
            structuredData.analysis.compliance_keywords.length > 0) {
          messages.push(`🔍 Compliance terms found: ${structuredData.analysis.compliance_keywords.slice(0, 3).join(', ')}`);
        }
        
        if (structuredData.summary && structuredData.summary.document_purpose) {
          messages.push(`🎯 Document purpose: ${structuredData.summary.document_purpose.replace('_', ' ')}`);
        }
      }
      
      messages.push(`📊 Relevance score: ${Math.round(score * 100)}%`);
      
    } else {
      messages.push('❌ Document does not appear relevant to the question.');
      
      if (structuredData) {
        if (structuredData.document && structuredData.document.type) {
          messages.push(`📄 Document type detected: ${structuredData.document.type.replace('_', ' ')}`);
        }
        
        if (structuredData.analysis && structuredData.analysis.compliance_keywords && 
            structuredData.analysis.compliance_keywords.length === 0) {
          messages.push('⚠️ No compliance-related terms found in document');
        }
      }
      
      messages.push(`📊 Relevance score: ${Math.round(score * 100)}% (threshold: 75%)`);
      
      // Provide specific suggestions based on question content
      const questionLower = questionText.toLowerCase();
      if (questionLower.includes('policy')) {
        messages.push('💡 This question requires a policy document. Please upload your relevant policy documentation.');
      } else if (questionLower.includes('audit')) {
        messages.push('💡 This question requires an audit report. Please upload your latest audit findings or assessment.');
      } else if (questionLower.includes('certificate')) {
        messages.push('💡 This question requires a certificate. Please upload your certification documents.');
      } else if (questionLower.includes('training')) {
        messages.push('💡 This question requires training documentation. Please upload training records or materials.');
      } else {
        messages.push('💡 Please review the question requirements and upload a more relevant document.');
      }
    }
    
    return messages.join(' ');
  }

  /**
   * Build comprehensive relevance message with guidance
   */
  private generateRelevanceMessage(
    score: number, 
    isRelevant: boolean, 
    keywordAnalysis: any, 
    aiAnalysis: any, 
    questionText: string
  ): string {
    const messages = [];
    
    if (isRelevant) {
      messages.push('✅ Document appears relevant to the question.');
      messages.push(`📊 Relevance score: ${Math.round(score * 100)}%`);
      
      if (keywordAnalysis.matchedTerms && keywordAnalysis.matchedTerms.length > 0) {
        messages.push(`🔍 Matched terms: ${keywordAnalysis.matchedTerms.slice(0, 3).join(', ')}`);
      }
      
    } else {
      messages.push('❌ Document does not appear relevant to the question.');
      messages.push(`📊 Relevance score: ${Math.round(score * 100)}% (threshold: 75%)`);
      
      // Provide specific suggestions based on question content
      const questionLower = questionText.toLowerCase();
      if (questionLower.includes('policy')) {
        messages.push('💡 This question requires a policy document. Please upload your relevant policy documentation.');
      } else if (questionLower.includes('audit')) {
        messages.push('💡 This question requires an audit report. Please upload your latest audit findings or assessment.');
      } else if (questionLower.includes('certificate')) {
        messages.push('💡 This question requires a certificate. Please upload your certification documents.');
      } else if (questionLower.includes('training')) {
        messages.push('💡 This question requires training documentation. Please upload training records or materials.');
      } else {
        messages.push('💡 Please review the question requirements and upload a more relevant document.');
      }
    }
    
    return messages.join(' ');
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
   * Identify document type based on content analysis
   */
  private identifyDocumentType(text: string, headers?: string[]): string {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('policy') || textLower.includes('procedure')) {
      return 'policy_document';
    } else if (textLower.includes('audit') || textLower.includes('assessment')) {
      return 'audit_report';
    } else if (textLower.includes('certificate') || textLower.includes('certification')) {
      return 'certificate';
    } else if (textLower.includes('agreement') || textLower.includes('contract')) {
      return 'legal_document';
    } else if (textLower.includes('training') || textLower.includes('education')) {
      return 'training_document';
    } else if (textLower.includes('incident') || textLower.includes('breach')) {
      return 'incident_report';
    } else if (textLower.includes('compliance') || textLower.includes('regulatory')) {
      return 'compliance_document';
    } else if (textLower.includes('security') || textLower.includes('cybersecurity')) {
      return 'security_document';
    } else if (textLower.includes('license') && textLower.includes('issued')) {
      return 'license';
    } else if (textLower.includes('insurance') && textLower.includes('coverage')) {
      return 'insurance_policy';
    } else if (textLower.includes('tax') || textLower.includes('irs') || textLower.includes('ein')) {
      return 'tax_document';
    } else if (textLower.includes('statement') && textLower.includes('financial')) {
      return 'financial_statement';
    } else {
      return 'general_document';
    }
  }
} 