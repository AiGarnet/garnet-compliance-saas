import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
import { DigitalOceanSpacesService } from '../../common/services/digitalocean-spaces.service';
import OpenAI from 'openai';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template_content: string;
  variables: string[]; // List of placeholder variables like {{Company_Name}}
  output_format: 'PDF' | 'TXT' | 'DOCX';
  created_at: Date;
  updated_at: Date;
}

export interface GenerateDocumentRequest {
  template_content: string;
  variables: Record<string, string>;
  output_format: 'PDF';
  output_filename: string;
  vendor_id?: number;
  question_id?: string;
  category?: string;
}

export interface GeneratedDocument {
  success: boolean;
  document_id?: string;
  filename?: string;
  download_url?: string;
  spaces_key?: string;
  content?: string;
  error?: string;
}

@Injectable()
export class DocumentGeneratorService {
  private readonly logger = new Logger(DocumentGeneratorService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly spacesService: DigitalOceanSpacesService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OpenAI API key not configured - document generation will be limited');
    }
  }

  /**
   * Main document generation method following the specified requirements
   */
  async generateDocument(request: GenerateDocumentRequest): Promise<GeneratedDocument> {
    this.logger.debug(`📄 DOCUMENT GENERATOR: Starting document generation for "${request.output_filename}"`);

    try {
      // Step 1: Validate input
      this.validateRequest(request);

      // Step 2: Replace all placeholders in template content
      const processedContent = this.replacePlaceholders(request.template_content, request.variables);

      // Step 3: Generate PDF document
      const pdfBuffer = await this.generatePDF(processedContent, request.output_filename);

      // Step 4: Upload to storage
      const uploadResult = await this.uploadDocument(
        pdfBuffer,
        request.output_filename,
        'application/pdf',
        request.vendor_id?.toString()
      );

      // Step 5: Save to database if vendor context provided
      let documentRecord = null;
      if (request.vendor_id) {
        documentRecord = await this.saveDocumentToDatabase({
          vendorId: request.vendor_id,
          questionId: request.question_id,
          filename: request.output_filename,
          fileType: 'application/pdf',
          fileSize: pdfBuffer.length,
          spacesKey: uploadResult.key,
          spacesUrl: uploadResult.url,
          category: request.category,
          templateContent: request.template_content,
          variables: request.variables
        });
      }

      this.logger.log(`✅ DOCUMENT GENERATOR: Successfully generated "${request.output_filename}"`);

      return {
        success: true,
        document_id: documentRecord?.id,
        filename: request.output_filename,
        download_url: uploadResult.url,
        spaces_key: uploadResult.key,
        content: processedContent
      };

    } catch (error: any) {
      this.logger.error(`❌ DOCUMENT GENERATOR: Error generating document: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message || 'Failed to generate document'
      };
    }
  }

  /**
   * Replace all placeholders ({{Variable_Name}}) with provided values
   */
  private replacePlaceholders(templateContent: string, variables: Record<string, string>): string {
    let processedContent = templateContent;

    // Find all placeholders in the format {{Variable_Name}}
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const placeholders = Array.from(templateContent.matchAll(placeholderRegex));

    this.logger.debug(`📄 DOCUMENT GENERATOR: Found ${placeholders.length} placeholders to replace`);

    // Replace each placeholder with its corresponding value
    for (const [fullMatch, variableName] of placeholders) {
      const variableValue = variables[variableName];
      
      if (variableValue !== undefined) {
        processedContent = processedContent.replace(new RegExp(`\\{\\{${variableName}\\}\\}`, 'g'), variableValue);
        this.logger.debug(`📄 DOCUMENT GENERATOR: Replaced {{${variableName}}} with value`);
      } else {
        this.logger.warn(`📄 DOCUMENT GENERATOR: No value provided for placeholder {{${variableName}}}`);
        // Keep the placeholder as-is if no value provided (as specified in requirements)
      }
    }

    // Check for any remaining unresolved placeholders
    const unresolvedPlaceholders = Array.from(processedContent.matchAll(placeholderRegex));
    if (unresolvedPlaceholders.length > 0) {
      this.logger.warn(`📄 DOCUMENT GENERATOR: ${unresolvedPlaceholders.length} placeholders remain unresolved`);
    }

    return processedContent;
  }

  /**
   * Generate professional PDF document from processed content
   */
  private async generatePDF(content: string, filename: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          }
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Add document header
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text(filename.replace('.pdf', '').replace(/_/g, ' '), {
             align: 'center'
           });

        doc.moveDown(2);

        // Process content line by line for proper formatting
        const lines = content.split('\n');
        let currentY = doc.y;

        for (const line of lines) {
          // Check if we need a new page
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }

          if (line.trim() === '') {
            doc.moveDown(0.5);
            currentY = doc.y;
            continue;
          }

          // Handle headers (lines that are all caps or start with #)
          if (line.toUpperCase() === line && line.length > 0) {
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text(line, { align: 'left' });
            doc.moveDown(0.5);
          }
          // Handle bullet points
          else if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
            doc.fontSize(11)
               .font('Helvetica')
               .text(line, { align: 'left', indent: 20 });
          }
          // Handle numbered lists
          else if (/^\d+\./.test(line.trim())) {
            doc.fontSize(11)
               .font('Helvetica')
               .text(line, { align: 'left', indent: 10 });
          }
          // Handle regular paragraphs
          else {
            doc.fontSize(11)
               .font('Helvetica')
               .text(line, { align: 'left' });
          }

          currentY = doc.y;
          
          // Add small spacing between lines
          if (lines.indexOf(line) < lines.length - 1) {
            doc.moveDown(0.3);
            currentY = doc.y;
          }
        }

        // Add footer with generation date
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc.fontSize(8)
             .font('Helvetica')
             .text(`Generated on ${new Date().toISOString().split('T')[0]} | Page ${i + 1} of ${pageCount}`, 
                    50, 750, { align: 'center' });
        }

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Upload generated document to storage
   */
  private async uploadDocument(
    documentBuffer: Buffer,
    filename: string,
    contentType: string,
    vendorId?: string
  ) {
    if (vendorId) {
      // Upload as evidence file
      return await this.spacesService.uploadEvidenceFile(
        documentBuffer,
        filename,
        contentType,
        vendorId,
        'AI Generated Document'
      );
    } else {
      // Upload as general document
      return await this.spacesService.uploadSupportingDocument(
        documentBuffer,
        filename,
        contentType,
        'system'
      );
    }
  }

  /**
   * Save document metadata to database
   */
  private async saveDocumentToDatabase(data: {
    vendorId: number;
    questionId?: string;
    filename: string;
    fileType: string;
    fileSize: number;
    spacesKey: string;
    spacesUrl: string;
    category?: string;
    templateContent: string;
    variables: Record<string, string>;
  }) {
    // Get vendor UUID
    const vendorQuery = 'SELECT uuid FROM vendors WHERE vendor_id = $1';
    const vendorResult = await this.databaseService.query(vendorQuery, [data.vendorId]);
    
    if (vendorResult.rows.length === 0) {
      throw new BadRequestException(`Vendor not found: ${data.vendorId}`);
    }

    const vendorUuid = vendorResult.rows[0].uuid;

    if (data.questionId) {
      // Save as supporting document for specific question
      const query = `
        INSERT INTO checklist_supporting_documents 
        (vendor_id, question_id, filename, file_type, file_size, spaces_key, spaces_url, 
         uploaded_at, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
        RETURNING *
      `;
      
      const metadata = {
        generated_by: 'ai',
        template_content: data.templateContent,
        variables_used: data.variables,
        category: data.category
      };

      const values = [
        vendorUuid, 
        data.questionId, 
        data.filename, 
        data.fileType, 
        data.fileSize, 
        data.spacesKey, 
        data.spacesUrl,
        JSON.stringify(metadata)
      ];
      
      const result = await this.databaseService.query(query, values);
      return result.rows[0];
    } else {
      // Save as evidence file
      const query = `
        INSERT INTO evidence_files 
        (vendor_id, filename, original_filename, file_type, file_size, spaces_key, spaces_url, 
         description, category, upload_date, uploaded_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NULL)
        RETURNING *
      `;
      
      const values = [
        vendorUuid,
        data.filename,
        data.filename,
        data.fileType,
        data.fileSize,
        data.spacesKey,
        data.spacesUrl,
        'AI Generated Evidence Document',
        data.category || 'Generated Document'
      ];
      
      const result = await this.databaseService.query(query, values);
      return result.rows[0];
    }
  }

  /**
   * Validate document generation request
   */
  private validateRequest(request: GenerateDocumentRequest): void {
    if (!request.template_content) {
      throw new BadRequestException('Template content is required');
    }

    if (!request.variables || typeof request.variables !== 'object') {
      throw new BadRequestException('Variables must be provided as an object');
    }

    if (request.output_format !== 'PDF') {
      throw new BadRequestException('Only PDF output format is currently supported');
    }

    if (!request.output_filename) {
      throw new BadRequestException('Output filename is required');
    }

    if (!request.output_filename.endsWith('.pdf')) {
      throw new BadRequestException('Output filename must end with .pdf');
    }
  }

  /**
   * Generate document using AI with templates
   */
  async generateDocumentWithAI(
    title: string,
    instructions: string,
    vendorId: number,
    category?: string,
    questionId?: string
  ): Promise<GeneratedDocument> {
    this.logger.debug(`🤖 AI DOCUMENT GENERATOR: Starting AI-assisted document generation for "${title}"`);

    if (!this.openai) {
      throw new BadRequestException('OpenAI API key not configured');
    }

    try {
      // Step 1: Get vendor context and compliance data
      const vendorContext = await this.getVendorContext(vendorId);
      const complianceContext = await this.getComplianceContext(category);

      // Step 2: Generate template content using AI
      const templateContent = await this.generateTemplateWithAI(
        title,
        instructions,
        vendorContext,
        complianceContext,
        category
      );

      // Step 3: Extract variables from vendor context
      const variables = this.extractVariablesFromContext(vendorContext);

      // Step 4: Generate filename
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const companyName = vendorContext?.company_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
      const documentType = title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${documentType}_${companyName}_${timestamp}.pdf`;

      // Step 5: Generate the document
      return await this.generateDocument({
        template_content: templateContent,
        variables,
        output_format: 'PDF',
        output_filename: filename,
        vendor_id: vendorId,
        question_id: questionId,
        category
      });

    } catch (error: any) {
      this.logger.error(`❌ AI DOCUMENT GENERATOR: Error: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message || 'Failed to generate document with AI'
      };
    }
  }

  /**
   * Generate template content using AI
   */
  private async generateTemplateWithAI(
    title: string,
    instructions: string,
    vendorContext: any,
    complianceContext: string,
    category?: string
  ): Promise<string> {
    const prompt = `Generate a professional compliance document template titled "${title}".

COMPANY CONTEXT:
${vendorContext ? `
- Company: {{Company_Name}}
- Industry: {{Industry}}
- Region: {{Region}}
- Website: {{Website}}
- Contact: {{Contact_Email}}
- CEO/Representative: {{CEO}}
` : ''}

INSTRUCTIONS:
${instructions}

CATEGORY: ${category || 'General Compliance'}

COMPLIANCE CONTEXT:
${complianceContext}

Generate a comprehensive document template that includes:
1. Executive Summary
2. Company Information section using {{Company_Name}}, {{Industry}}, etc.
3. Policy Statement with {{Effective_Date}}
4. Implementation details
5. Controls and procedures
6. Monitoring and review processes
7. Contact information using {{Contact_Email}}

Use placeholder variables in double curly braces like {{Company_Name}}, {{Effective_Date}}, {{CEO}}, {{Policy_Portal}}, etc. for dynamic content.

The document should be professional, compliance-focused, and ready for PDF generation with proper formatting including headers, bullet points, and sections.`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional compliance document template generator. Create detailed, professionally formatted document templates with placeholder variables for customization."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.3
    });

    return completion.choices[0]?.message?.content || 'Failed to generate template content';
  }

  /**
   * Get vendor context for document generation
   */
  private async getVendorContext(vendorId: number): Promise<any> {
    try {
      const query = `
        SELECT 
          company_name,
          industry,
          region,
          description,
          website,
          contact_email,
          contact_name,
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
   * Get compliance context based on category
   */
  private async getComplianceContext(category?: string): Promise<string> {
    // This could be enhanced to query a compliance frameworks database
    const defaultContext = `
This document addresses key compliance requirements including:
- Data protection and privacy (GDPR, CCPA)
- Information security (ISO 27001, SOC 2)
- Business continuity and risk management
- Vendor assessment and due diligence requirements
- Regulatory compliance monitoring
`;

    return defaultContext;
  }

  /**
   * Extract variables from vendor context
   */
  private extractVariablesFromContext(vendorContext: any): Record<string, string> {
    const today = new Date();
    const effectiveDate = today.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return {
      Company_Name: vendorContext?.company_name || 'Your Company',
      Industry: vendorContext?.industry || 'Technology',
      Region: vendorContext?.region || 'Global',
      Website: vendorContext?.website || 'www.yourcompany.com',
      Contact_Email: vendorContext?.contact_email || 'contact@yourcompany.com',
      CEO: vendorContext?.contact_name || 'Chief Executive Officer',
      Effective_Date: effectiveDate,
      Policy_Portal: vendorContext?.website || 'https://portal.yourcompany.com',
      Current_Date: effectiveDate,
      Year: today.getFullYear().toString(),
      Month: today.toLocaleDateString('en-US', { month: 'long' }),
      Day: today.getDate().toString()
    };
  }
} 