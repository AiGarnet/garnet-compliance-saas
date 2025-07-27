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
        throw new BadRequestException('No file uploaded');
      }

      if (!validationRequest.questionId) {
        throw new BadRequestException('Question ID is required');
      }

      this.logger.log(`Validating document relevance for question ${validationRequest.questionId}`);

      // Get the question text from database
      const question = await this.checklistsService.getQuestionById(validationRequest.questionId);
      if (!question) {
        throw new BadRequestException('Question not found');
      }

      // Extract document content
      const documentContent = await this.documentsService.extractDocumentContent(file);
      
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
      throw error;
    }
  }
} 