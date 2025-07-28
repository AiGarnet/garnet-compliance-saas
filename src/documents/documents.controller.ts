import { 
  Controller, 
  Post, 
  Body, 
  UploadedFile, 
  UseInterceptors, 
  BadRequestException,
  UseGuards,
  Logger
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { DocumentsService } from './documents.service';
import { ChecklistsService } from '../checklists/checklists.service';
import { 
  DocumentValidationRequestDto, 
  DocumentRelevanceResponseDto 
} from '../checklists/dto/checklist.dto';

@Controller('api/documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(
    private readonly documentsService: DocumentsService,
    private readonly checklistsService: ChecklistsService
  ) {}

  /**
   * Validate document relevance to a specific question
   * POST /api/documents/validate
   */
  @Post('validate')
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  async validateDocumentRelevance(
    @Body() validationRequest: DocumentValidationRequestDto,
    @UploadedFile() file: Express.Multer.File
  ): Promise<DocumentRelevanceResponseDto> {
    try {
      if (!file) {
        throw new BadRequestException('No file was uploaded for validation. Please select a document and try again.');
      }

      if (!validationRequest.questionId) {
        throw new BadRequestException('Question ID is required for document validation.');
      }

      // Validate file type for content extraction
      const allowedMimeTypes = [
        'application/pdf',
        'text/plain',
        'application/json',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif'
      ];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `File type "${file.mimetype}" cannot be validated. Please upload a PDF, TXT, JSON, DOC, DOCX, or image file. PDFs provide the most accurate validation results.`
        );
      }

      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        throw new BadRequestException(
          `File size (${Math.round(file.size / (1024 * 1024))}MB) exceeds the maximum allowed size of 50MB for validation.`
        );
      }

      this.logger.log(`Validating document relevance for question ${validationRequest.questionId}`);

      // Get the question text from database
      const question = await this.checklistsService.getQuestionById(validationRequest.questionId);
      if (!question) {
        throw new BadRequestException('Question not found. Please verify the question ID and try again.');
      }

      // Extract document content
      const documentContent = await this.documentsService.extractDocumentContent(file);
      
      // Check if content extraction was successful
      if (documentContent.includes('extraction failed') || documentContent.includes('Error:')) {
        this.logger.warn(`Content extraction issues for file ${file.originalname}: ${documentContent}`);
        // Still proceed with validation but note the extraction issues
      }
      
      // Check relevance
      const relevanceResult = await this.documentsService.checkDocumentRelevance(
        question.questionText,
        documentContent
      );

      this.logger.log(
        `Document validation completed for question ${validationRequest.questionId}: ` +
        `relevance score ${relevanceResult.relevanceScore}, ` +
        `is relevant: ${relevanceResult.isRelevant}`
      );

      return relevanceResult;

    } catch (error) {
      this.logger.error(`Document validation failed: ${error.message}`, error.stack);
      
      // Provide helpful error messages based on error type
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      if (error.message.includes('OpenAI') || error.message.includes('API')) {
        throw new BadRequestException('Document validation service is temporarily unavailable. Please try again later.');
      } else if (error.message.includes('timeout')) {
        throw new BadRequestException('Document validation timed out. Please try with a smaller file or check your connection.');
      } else {
        throw new BadRequestException('Document validation failed due to an unexpected error. Please verify your file is valid and try again.');
      }
    }
  }
} 