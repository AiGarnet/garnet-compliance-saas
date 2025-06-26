import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChecklistsService } from './checklists.service';
import { AiService } from '../ai/ai.service';
import {
  CreateChecklistDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  CreateSupportingDocumentDto,
  GenerateAnswersDto,
  QuestionStatus,
  ChecklistResponseDto,
  QuestionResponseDto
} from './dto/checklist.dto';
import { Checklist, ChecklistQuestion } from './entities/checklist.entity';

@Controller('api/checklists')
@UseGuards(JwtAuthGuard)
export class ChecklistsController {
  private readonly logger = new Logger(ChecklistsController.name);

  constructor(
    private readonly checklistsService: ChecklistsService,
    private readonly aiService: AiService,
  ) {}

  // Upload and process checklist file
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadChecklist(
    @UploadedFile() file: Express.Multer.File,
    @Body('vendorId', ParseUUIDPipe) vendorId: string,
    @Body('name') name: string,
    @Request() req
  ): Promise<{ checklist: ChecklistResponseDto; questions: QuestionResponseDto[] }> {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Create checklist record
      const createChecklistDto: CreateChecklistDto = {
        vendorId,
        name: name || file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        originalFilename: file.originalname,
        fileContent: file.buffer.toString() // Store file content temporarily
      };

      const checklist = await this.checklistsService.createChecklist(
        createChecklistDto, 
        req.user?.id
      );

      // Extract text from file
      const extractedText = await this.checklistsService.extractTextFromFile(file);
      
      // Parse questions from text
      const questionsData = this.checklistsService.parseQuestionsFromText(extractedText);
      
      // Save questions to database
      const questions = await this.checklistsService.addQuestionsToChecklist(
        checklist.id,
        vendorId,
        questionsData
      );

      this.logger.log(`Uploaded checklist ${checklist.id} with ${questions.length} questions for vendor ${vendorId}`);

      return {
        checklist: this.mapToChecklistResponse(checklist),
        questions: questions.map(q => this.mapToQuestionResponse(q))
      };
    } catch (error) {
      this.logger.error(`Failed to upload checklist: ${error.message}`);
      throw new BadRequestException('Failed to process checklist upload');
    }
  }

  // Get all checklists for a vendor
  @Get('vendor/:vendorId')
  async getVendorChecklists(
    @Param('vendorId', ParseUUIDPipe) vendorId: string
  ): Promise<ChecklistResponseDto[]> {
    const checklists = await this.checklistsService.getVendorChecklists(vendorId);
    return checklists.map(checklist => this.mapToChecklistResponse(checklist));
  }

  // Get specific checklist with questions
  @Get(':checklistId/vendor/:vendorId')
  async getChecklist(
    @Param('checklistId', ParseUUIDPipe) checklistId: string,
    @Param('vendorId', ParseUUIDPipe) vendorId: string
  ): Promise<{ checklist: ChecklistResponseDto; questions: QuestionResponseDto[] }> {
    const checklist = await this.checklistsService.getChecklist(checklistId, vendorId);
    const questions = await this.checklistsService.getChecklistQuestions(checklistId, vendorId);

    return {
      checklist: this.mapToChecklistResponse(checklist),
      questions: questions.map(q => this.mapToQuestionResponse(q))
    };
  }

  // Get questions for a checklist
  @Get(':checklistId/questions/vendor/:vendorId')
  async getChecklistQuestions(
    @Param('checklistId', ParseUUIDPipe) checklistId: string,
    @Param('vendorId', ParseUUIDPipe) vendorId: string
  ): Promise<QuestionResponseDto[]> {
    const questions = await this.checklistsService.getChecklistQuestions(checklistId, vendorId);
    return questions.map(q => this.mapToQuestionResponse(q));
  }

  // Generate AI answers for questions
  @Post('generate-answers')
  async generateAnswers(
    @Body() generateDto: GenerateAnswersDto,
    @Request() req
  ): Promise<{ answers: Array<{ question: string; answer: string; confidence: number }> }> {
    try {
      // Get vendor questions that need AI answers
      const pendingQuestions = await this.checklistsService.getVendorQuestions(
        generateDto.vendorId, 
        QuestionStatus.PENDING
      );

      if (pendingQuestions.length === 0) {
        return { answers: [] };
      }

      // Generate AI answers for each question
      const aiAnswers = [];
      
      for (const question of pendingQuestions) {
        try {
          const aiResponse = await this.aiService.generateAnswer({
            question: question.questionText,
            context: generateDto.context || 'Security compliance questionnaire',
            vendorId: parseInt(generateDto.vendorId) // Convert to number if needed
          });

          aiAnswers.push({
            questionId: question.id,
            question: question.questionText,
            answer: aiResponse.answer,
            confidence: aiResponse.confidence || 0.8
          });

          // Update question with AI answer
          await this.checklistsService.updateQuestion(question.id, generateDto.vendorId, {
            aiAnswer: aiResponse.answer,
            confidenceScore: aiResponse.confidence || 0.8,
            status: QuestionStatus.COMPLETED
          });

        } catch (error) {
          this.logger.error(`Failed to generate answer for question ${question.id}: ${error.message}`);
          
          // Update with fallback message
          await this.checklistsService.updateQuestion(question.id, generateDto.vendorId, {
            aiAnswer: 'Unable to generate answer automatically. Please provide manual response.',
            confidenceScore: 0.0,
            status: QuestionStatus.NEEDS_SUPPORT
          });
        }
      }

      this.logger.log(`Generated ${aiAnswers.length} AI answers for vendor ${generateDto.vendorId}`);

      return {
        answers: aiAnswers.map(({ questionId, ...rest }) => rest)
      };
    } catch (error) {
      this.logger.error(`Failed to generate AI answers: ${error.message}`);
      throw new BadRequestException('Failed to generate AI answers');
    }
  }

  // Update question status or answer
  @Put('questions/:questionId/vendor/:vendorId')
  async updateQuestion(
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Body() updateDto: UpdateQuestionDto
  ): Promise<QuestionResponseDto> {
    const question = await this.checklistsService.updateQuestion(questionId, vendorId, updateDto);
    return this.mapToQuestionResponse(question);
  }

  // Upload supporting document for a question
  @Post('questions/:questionId/documents/vendor/:vendorId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSupportingDocument(
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const createDocDto: CreateSupportingDocumentDto = {
      questionId,
      filename: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      // TODO: Upload to DO/S3 and store path
      filePath: `/uploads/${vendorId}/${questionId}/${file.originalname}`
    };

    return await this.checklistsService.addSupportingDocument(
      vendorId,
      createDocDto,
      req.user?.id
    );
  }

  // Get vendor questions (for AI questionnaire section)
  @Get('vendor/:vendorId/questions')
  async getVendorQuestions(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Query('status') status?: QuestionStatus
  ): Promise<QuestionResponseDto[]> {
    const questions = await this.checklistsService.getVendorQuestions(vendorId, status);
    return questions.map(q => this.mapToQuestionResponse(q));
  }

  // Delete checklist
  @Delete(':checklistId/vendor/:vendorId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteChecklist(
    @Param('checklistId', ParseUUIDPipe) checklistId: string,
    @Param('vendorId', ParseUUIDPipe) vendorId: string
  ): Promise<void> {
    await this.checklistsService.deleteChecklist(checklistId, vendorId);
  }

  // Helper methods for response mapping
  private mapToChecklistResponse(checklist: Checklist): ChecklistResponseDto {
    return {
      id: checklist.id,
      vendorId: checklist.vendorId,
      name: checklist.name,
      fileType: checklist.fileType,
      fileSize: checklist.fileSize,
      originalFilename: checklist.originalFilename,
      extractionStatus: checklist.extractionStatus as any,
      questionCount: checklist.questionCount,
      uploadDate: checklist.uploadDate,
      createdAt: checklist.createdAt,
      updatedAt: checklist.updatedAt
    };
  }

  private mapToQuestionResponse(question: ChecklistQuestion): QuestionResponseDto {
    return {
      id: question.id,
      checklistId: question.checklistId,
      vendorId: question.vendorId,
      questionText: question.questionText,
      questionOrder: question.questionOrder,
      status: question.status as QuestionStatus,
      aiAnswer: question.aiAnswer,
      confidenceScore: question.confidenceScore,
      requiresDocument: question.requiresDocument,
      documentDescription: question.documentDescription,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      supportingDocuments: question.supportingDocuments?.map(doc => ({
        id: doc.id,
        questionId: doc.questionId,
        vendorId: doc.vendorId,
        filename: doc.filename,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        filePath: doc.filePath,
        uploadedAt: doc.uploadedAt
      }))
    };
  }
} 