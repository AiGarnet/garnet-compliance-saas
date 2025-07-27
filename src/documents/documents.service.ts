import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { DocumentRelevanceResponseDto } from '../checklists/dto/checklist.dto';

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
      
      // For unsupported types, return basic file metadata
      return `Document: ${file.originalname}\nType: ${file.mimetype}\nSize: ${file.size} bytes\nContent extraction not yet supported for this file type.`;
      
    } catch (error) {
      this.logger.error(`Failed to extract content from document: ${error.message}`);
      return `Document: ${file.originalname}\nContent extraction failed: ${error.message}`;
    }
  }

  /**
   * Check relevance between question and document content
   */
  async checkDocumentRelevance(
    questionText: string,
    documentContent: string,
    threshold: number = 0.75
  ): Promise<DocumentRelevanceResponseDto> {
    try {
      if (!this.openai) {
        return {
          relevanceScore: 0.5,
          isRelevant: false,
          message: 'OpenAI API not configured. Manual review required.',
          extractedContent: documentContent,
          questionText
        };
      }

      // Use OpenAI to analyze relevance
      const prompt = this.buildRelevancePrompt(questionText, documentContent);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500
      });

      const response = completion.choices[0].message.content || '';
      const analysis = this.parseRelevanceResponse(response);
      
      return {
        relevanceScore: analysis.score,
        isRelevant: analysis.score >= threshold,
        message: analysis.message,
        extractedContent: documentContent.length > 500 ? 
          documentContent.substring(0, 500) + '...' : documentContent,
        questionText
      };
      
    } catch (error) {
      this.logger.error(`Failed to check document relevance: ${error.message}`);
      return {
        relevanceScore: 0,
        isRelevant: false,
        message: `Relevance analysis failed: ${error.message}`,
        extractedContent: documentContent,
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
    // TODO: Implement PDF parsing with pdf-parse library
    // For now, return placeholder
    return `PDF Document: ${file.originalname}\nSize: ${file.size} bytes\n[PDF content extraction will be implemented with pdf-parse library]`;
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