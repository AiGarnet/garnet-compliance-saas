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
  Logger,
  NotFoundException,
  Response,
  HttpException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
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
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/log-activity.decorator';
import { ChecklistExtractionStatus } from './dto/checklist.dto';

@Controller('api/checklists')
@UseGuards(JwtAuthGuard)
export class ChecklistsController {
  private readonly logger = new Logger(ChecklistsController.name);

  constructor(
    private readonly checklistsService: ChecklistsService,
    private readonly aiService: AiService,
  ) {}

  // Handle GET requests to upload endpoint with helpful message
  @Get('upload')
  @Public()
  async getUploadInfo() {
    return {
      message: 'Checklist upload endpoint',
      method: 'POST',
      description: 'To upload a checklist file, send a POST request with a multipart form containing the file and vendorId',
      endpoint: '/api/checklists/upload',
      requiredFields: ['file (multipart)', 'vendorId (string)', 'name (optional string)'],
      example: 'FormData with file attachment and vendorId'
    };
  }

  // Upload and process checklist file with DigitalOcean Spaces integration
  @Post('upload')
  @Public()
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

      // Use the new DigitalOcean Spaces integrated upload method
      const result = await this.checklistsService.uploadChecklistFile(
        file,
        vendorId,
        name,
        req.user?.id
      );

      this.logger.log(`Uploaded checklist ${result.checklist.id} with ${result.questions.length} questions to Spaces for vendor ${vendorId}`);

      return {
        checklist: this.mapToChecklistResponse(result.checklist),
        questions: result.questions.map(q => this.mapToQuestionResponse(q))
      };
    } catch (error) {
      this.logger.error(`Failed to upload checklist: ${error.message}`);
      throw new BadRequestException('Failed to process checklist upload');
    }
  }

  // Get all checklists for a vendor
  @Get('vendor/:vendorId')
  @Public()
  async getVendorChecklists(
    @Param('vendorId', ParseUUIDPipe) vendorId: string
  ): Promise<ChecklistResponseDto[]> {
    const checklists = await this.checklistsService.getVendorChecklists(vendorId);
    return checklists.map(checklist => this.mapToChecklistResponse(checklist));
  }

  // Get specific checklist with questions
  @Get(':checklistId/vendor/:vendorId')
  @Public()
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
  @Public()
  async getChecklistQuestions(
    @Param('checklistId', ParseUUIDPipe) checklistId: string,
    @Param('vendorId', ParseUUIDPipe) vendorId: string
  ): Promise<QuestionResponseDto[]> {
    const questions = await this.checklistsService.getChecklistQuestions(checklistId, vendorId);
    return questions.map(q => this.mapToQuestionResponse(q));
  }

  // Add manual questions to a checklist
  @Post(':checklistId/questions/vendor/:vendorId')
  @Public()
  async addManualQuestion(
    @Param('checklistId', ParseUUIDPipe) checklistId: string,
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Body() createQuestionDto: CreateQuestionDto,
    @Request() req
  ): Promise<QuestionResponseDto> {
    try {
      // Verify checklist exists and belongs to vendor
      await this.checklistsService.getChecklist(checklistId, vendorId);
      
      // Get current questions count to set proper order
      const existingQuestions = await this.checklistsService.getChecklistQuestions(checklistId, vendorId);
      const nextOrder = existingQuestions.length + 1;
      
      // Add the manual question
      const questionData = {
        ...createQuestionDto,
        questionOrder: nextOrder,
        status: QuestionStatus.PENDING
      };
      
      const questions = await this.checklistsService.addQuestionsToChecklist(
        checklistId,
        vendorId,
        [questionData]
      );
      
      const addedQuestion = questions[0];
      this.logger.log(`Added manual question ${addedQuestion.id} to checklist ${checklistId} for vendor ${vendorId}`);
      
      return this.mapToQuestionResponse(addedQuestion);
    } catch (error) {
      this.logger.error(`Failed to add manual question: ${error.message}`);
      throw new BadRequestException('Failed to add manual question');
    }
  }

  // Add standalone manual question to vendor (creates default checklist if needed)
  @Post('vendor/:vendorId/standalone-question')
  @Public()
  async addStandaloneManualQuestion(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Body() createQuestionDto: CreateQuestionDto,
    @Request() req
  ): Promise<QuestionResponseDto> {
    try {
      // Check if vendor has any existing checklists
      const existingChecklists = await this.checklistsService.getChecklistsByVendor(vendorId);
      
      let checklistId: string;
      
      if (existingChecklists.length === 0) {
        // Create a default checklist for manual questions
        const defaultChecklist = await this.checklistsService.createChecklist({
          vendorId,
          name: 'Manual Questions',
          fileType: 'application/manual',
          fileSize: 0,
          originalFilename: 'manual-questions',
          extractionStatus: ChecklistExtractionStatus.COMPLETED
        }, req.user?.id);
        
        checklistId = defaultChecklist.id;
        this.logger.log(`Created default checklist ${checklistId} for vendor ${vendorId}`);
      } else {
        // Use the first existing checklist
        checklistId = existingChecklists[0].id;
      }
      
      // Get current questions count to set proper order
      const existingQuestions = await this.checklistsService.getChecklistQuestions(checklistId, vendorId);
      const nextOrder = existingQuestions.length + 1;
      
      // Add the manual question
      const questionData = {
        ...createQuestionDto,
        questionOrder: nextOrder,
        status: QuestionStatus.PENDING
      };
      
      const questions = await this.checklistsService.addQuestionsToChecklist(
        checklistId,
        vendorId,
        [questionData]
      );
      
      const addedQuestion = questions[0];
      this.logger.log(`Added standalone manual question ${addedQuestion.id} to checklist ${checklistId} for vendor ${vendorId}`);
      
      return this.mapToQuestionResponse(addedQuestion);
    } catch (error) {
      this.logger.error(`Failed to add standalone manual question: ${error.message}`);
      throw new BadRequestException('Failed to add standalone manual question');
    }
  }

  // Generate AI answers for questions
  @Post('generate-answers')
  @Public()
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
            vendorId: parseInt(generateDto.vendorId), // Convert to number if needed
            selectedEvidenceFiles: generateDto.selectedEvidenceFiles
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

      // Auto-sync questions to questionnaire system after generating answers
      if (generateDto.checklistId) {
        try {
          await this.checklistsService.syncQuestionsToQuestionnaire(generateDto.checklistId, generateDto.vendorId);
          this.logger.log(`Auto-synced checklist ${generateDto.checklistId} to questionnaire system`);
        } catch (syncError) {
          this.logger.warn(`Failed to auto-sync to questionnaire system: ${syncError.message}`);
          // Don't fail the main operation if sync fails
        }
      }

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
  @Public()
  async updateQuestion(
    @Param('questionId') questionId: string,
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Body() updateDto: UpdateQuestionDto
  ): Promise<QuestionResponseDto> {
    const question = await this.checklistsService.updateQuestion(questionId, vendorId, updateDto);
    return this.mapToQuestionResponse(question);
  }

  // Upload supporting document for a question with DigitalOcean Spaces integration
  @Post('questions/:questionId/documents/vendor/:vendorId')
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  async uploadSupportingDocument(
    @Param('questionId') questionId: string,
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Use the new DigitalOcean Spaces integrated upload method
    const document = await this.checklistsService.uploadSupportingDocumentFile(
      file,
      vendorId,
      questionId,
      req.user?.id
    );

    this.logger.log(`Uploaded supporting document ${document.id} to Spaces for question ${questionId}`);

    return {
      id: document.id,
      questionId: document.questionId,
      vendorId: document.vendorId,
      filename: document.filename,
      fileType: document.fileType,
      fileSize: document.fileSize,
      filePath: document.filePath,
      spacesUrl: document.spacesUrl,
      spacesKey: document.spacesKey,
      uploadedAt: document.uploadedAt
    };
  }

  // Get vendor questions (for AI questionnaire section)
  @Get('vendor/:vendorId/questions')
  @Public()
  async getVendorQuestions(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Query('status') status?: QuestionStatus
  ): Promise<QuestionResponseDto[]> {
    const questions = await this.checklistsService.getVendorQuestions(vendorId, status);
    return questions.map(q => this.mapToQuestionResponse(q));
  }

  // Delete checklist
  @Delete(':checklistId/vendor/:vendorId')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteChecklist(
    @Param('checklistId', ParseUUIDPipe) checklistId: string,
    @Param('vendorId', ParseUUIDPipe) vendorId: string
  ): Promise<void> {
    await this.checklistsService.deleteChecklist(checklistId, vendorId);
  }

  // Send checklist questions to AI and create questionnaire responses
  @Post(':checklistId/vendor/:vendorId/send-to-ai')
  @Public()
  async sendChecklistToAI(
    @Param('checklistId', ParseUUIDPipe) checklistId: string,
    @Param('vendorId', ParseUUIDPipe) vendorId: string
  ): Promise<{ message: string; questionCount: number; questionnaireId: string }> {
    try {
      const result = await this.checklistsService.sendChecklistToAI(checklistId, vendorId);
      
      this.logger.log(`Successfully sent checklist ${checklistId} questions to AI for vendor ${vendorId}`);
      return {
        message: 'Checklist questions successfully sent to AI for response generation',
        questionCount: result.questionCount,
        questionnaireId: result.questionnaireId
      };
    } catch (error) {
      this.logger.error(`Failed to send checklist to AI: ${error.message}`);
      throw new BadRequestException('Failed to send checklist to AI');
    }
  }

  // NEW: Send completed checklist to Trust Portal
  @Post(':checklistId/vendor/:vendorId/send-to-trust-portal')
  @Public()
  async sendChecklistToTrustPortal(
    @Param('checklistId', ParseUUIDPipe) checklistId: string,
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Body() submitData?: { 
      message?: string; 
      title?: string; 
      isFollowUp?: boolean; 
      followUpType?: string; 
      followUpReason?: string; 
      parentSubmissionId?: number;
    }
  ): Promise<{ message: string; trustPortalId: string; itemCount: number }> {
    try {
      const result = await this.checklistsService.sendChecklistToTrustPortal(checklistId, vendorId, submitData);
      
      this.logger.log(`Successfully sent checklist ${checklistId} to Trust Portal for vendor ${vendorId}`);
      return {
        message: 'Checklist successfully sent to Trust Portal',
        trustPortalId: result.trustPortalId,
        itemCount: result.itemCount
      };
    } catch (error) {
      this.logger.error(`Failed to send checklist to Trust Portal: ${error.message}`);
      if (error.message.includes('not completed')) {
        throw new BadRequestException('All checklist questions must be completed before sending to Trust Portal');
      }
      throw new BadRequestException('Failed to send checklist to Trust Portal');
    }
  }

  // Get all supporting documents for a vendor
  @Get('vendor/:vendorId/documents')
  @Public()
  async getVendorSupportingDocuments(
    @Param('vendorId', ParseUUIDPipe) vendorId: string
  ) {
    const documents = await this.checklistsService.getVendorSupportingDocuments(vendorId);
    
    return documents.map(doc => ({
      id: doc.id,
      questionId: doc.questionId,
      vendorId: doc.vendorId,
      filename: doc.filename,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      filePath: doc.filePath,
      spacesUrl: doc.spacesUrl,
      spacesKey: doc.spacesKey,
      uploadedAt: doc.uploadedAt
    }));
  }

  // Serve supporting document with signed URL (for private files)
  @Get('documents/:documentId/download')
  @Public()
  async downloadSupportingDocument(
    @Param('documentId') documentId: string,
    @Response() res
  ) {
    try {
      this.logger.log(`Attempting to download document with ID: ${documentId}`);
      
      const document = await this.checklistsService.getSupportingDocumentById(documentId);
      
      if (!document) {
        throw new NotFoundException('Document not found');
      }

      this.logger.log(`Found document: ${JSON.stringify({
        id: document.id,
        filename: document.filename,
        spacesKey: document.spacesKey,
        spacesUrl: document.spacesUrl
      })}`);

      // Generate signed URL for secure access
      this.logger.log(`Generating signed URL for document with spacesKey: ${document.spacesKey}`);
      const signedUrl = await this.checklistsService.generateDocumentSignedUrl(document.spacesKey);
      
      this.logger.log(`Generated signed URL: ${signedUrl}`);
      
      // Redirect to the signed URL
      return res.redirect(signedUrl);
    } catch (error) {
      this.logger.error(`Error serving document ${documentId}: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to serve document: ${error.message}`);
    }
  }

  // Delete supporting document (from database and DigitalOcean Spaces)
  @Delete('documents/:documentId/vendor/:vendorId')
  @Public()
  async deleteSupportingDocument(
    @Param('documentId') documentId: string,
    @Param('vendorId', ParseUUIDPipe) vendorId: string
  ) {
    try {
      const result = await this.checklistsService.deleteSupportingDocument(documentId, vendorId);
      
      this.logger.log(`Deleted supporting document ${documentId} for vendor ${vendorId}`);
      
      return {
        success: true,
        message: 'Supporting document deleted successfully'
      };
    } catch (error) {
      this.logger.error(`Error deleting document ${documentId}: ${error.message}`);
      throw new BadRequestException('Failed to delete supporting document');
    }
  }

  // Get organization-wide checklist count
  @Get('organizations/:organizationId/count')
  @Public()
  async getOrganizationChecklistCount(
    @Param('organizationId') organizationId: string
  ) {
    try {
      const count = await this.checklistsService.getOrganizationChecklistCount(organizationId);
      
      return {
        success: true,
        count,
      };
    } catch (error: any) {
      this.logger.error(`Error getting organization checklist count for ${organizationId}:`, error);
      throw new BadRequestException(`Failed to get organization checklist count: ${error.message}`);
    }
  }

  // Get organization-wide supporting documents count
  @Get('organizations/:organizationId/supporting-documents/count')
  @Public()
  async getOrganizationSupportingDocumentsCount(
    @Param('organizationId') organizationId: string
  ) {
    try {
      const count = await this.checklistsService.getOrganizationSupportingDocumentsCount(organizationId);
      
      return {
        success: true,
        count,
      };
    } catch (error: any) {
      this.logger.error(`Error getting organization supporting documents count for ${organizationId}:`, error);
      throw new BadRequestException(`Failed to get organization supporting documents count: ${error.message}`);
    }
  }

  @Get('pending-tasks')
  @ApiOperation({ summary: 'Get pending tasks analysis for dashboard' })
  @ApiResponse({ status: 200, description: 'Returns pending tasks for the user\'s organization' })
  async getPendingTasks(@CurrentUser() user?: any) {
    try {
      if (!user?.organization_id) {
        throw new HttpException('User must belong to an organization', HttpStatus.UNAUTHORIZED);
      }

      const pendingTasks = await this.checklistsService.getPendingTasks(user.organization_id);
      
      return {
        success: true,
        data: pendingTasks,
        meta: {
          timestamp: new Date().toISOString(),
          count: pendingTasks.length,
          organizationId: user.organization_id
        }
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to fetch pending tasks',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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