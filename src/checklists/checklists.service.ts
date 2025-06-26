import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Checklist, ChecklistQuestion, ChecklistSupportingDocument } from './entities/checklist.entity';
import { 
  CreateChecklistDto, 
  CreateQuestionDto, 
  UpdateQuestionDto, 
  CreateSupportingDocumentDto,
  GenerateAnswersDto,
  ChecklistExtractionStatus,
  QuestionStatus
} from './dto/checklist.dto';

@Injectable()
export class ChecklistsService {
  private readonly logger = new Logger(ChecklistsService.name);

  constructor(
    @InjectRepository(Checklist)
    private checklistRepository: Repository<Checklist>,
    @InjectRepository(ChecklistQuestion)
    private questionRepository: Repository<ChecklistQuestion>,
    @InjectRepository(ChecklistSupportingDocument)
    private documentRepository: Repository<ChecklistSupportingDocument>,
  ) {}

  // Create a new checklist for a vendor
  async createChecklist(createChecklistDto: CreateChecklistDto, userId?: string): Promise<Checklist> {
    try {
      const checklist = this.checklistRepository.create({
        ...createChecklistDto,
        uploadedBy: userId,
        extractionStatus: ChecklistExtractionStatus.PENDING,
      });

      const savedChecklist = await this.checklistRepository.save(checklist);
      this.logger.log(`Created checklist ${savedChecklist.id} for vendor ${createChecklistDto.vendorId}`);
      
      return savedChecklist;
    } catch (error) {
      this.logger.error(`Failed to create checklist: ${error.message}`);
      throw new BadRequestException('Failed to create checklist');
    }
  }

  // Get all checklists for a specific vendor (ensures data privacy)
  async getVendorChecklists(vendorId: string): Promise<Checklist[]> {
    try {
      const checklists = await this.checklistRepository.find({
        where: { vendorId },
        relations: ['questions'],
        order: { uploadDate: 'DESC' }
      });

      this.logger.log(`Retrieved ${checklists.length} checklists for vendor ${vendorId}`);
      return checklists;
    } catch (error) {
      this.logger.error(`Failed to get checklists for vendor ${vendorId}: ${error.message}`);
      throw new BadRequestException('Failed to retrieve checklists');
    }
  }

  // Get a specific checklist with vendor verification
  async getChecklist(checklistId: string, vendorId: string): Promise<Checklist> {
    try {
      const checklist = await this.checklistRepository.findOne({
        where: { id: checklistId, vendorId },
        relations: ['questions', 'questions.supportingDocuments'],
      });

      if (!checklist) {
        throw new NotFoundException('Checklist not found or access denied');
      }

      return checklist;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get checklist ${checklistId}: ${error.message}`);
      throw new BadRequestException('Failed to retrieve checklist');
    }
  }

  // Add questions to a checklist
  async addQuestionsToChecklist(
    checklistId: string, 
    vendorId: string, 
    questions: CreateQuestionDto[]
  ): Promise<ChecklistQuestion[]> {
    try {
      // Verify checklist belongs to vendor
      const checklist = await this.getChecklist(checklistId, vendorId);

      // Create questions
      const questionEntities = questions.map((questionDto, index) => 
        this.questionRepository.create({
          ...questionDto,
          checklistId,
          vendorId,
          questionOrder: questionDto.questionOrder || index + 1,
          status: QuestionStatus.PENDING
        })
      );

      const savedQuestions = await this.questionRepository.save(questionEntities);

      // Update checklist question count and status
      await this.checklistRepository.update(checklistId, {
        questionCount: savedQuestions.length,
        extractionStatus: ChecklistExtractionStatus.COMPLETED
      });

      this.logger.log(`Added ${savedQuestions.length} questions to checklist ${checklistId}`);
      return savedQuestions;
    } catch (error) {
      this.logger.error(`Failed to add questions to checklist ${checklistId}: ${error.message}`);
      throw new BadRequestException('Failed to add questions to checklist');
    }
  }

  // Get questions for a checklist with vendor verification
  async getChecklistQuestions(checklistId: string, vendorId: string): Promise<ChecklistQuestion[]> {
    try {
      // Verify access
      await this.getChecklist(checklistId, vendorId);

      const questions = await this.questionRepository.find({
        where: { checklistId, vendorId },
        relations: ['supportingDocuments'],
        order: { questionOrder: 'ASC' }
      });

      return questions;
    } catch (error) {
      this.logger.error(`Failed to get questions for checklist ${checklistId}: ${error.message}`);
      throw new BadRequestException('Failed to retrieve questions');
    }
  }

  // Update a question (AI answer, status, etc.)
  async updateQuestion(
    questionId: string, 
    vendorId: string, 
    updateDto: UpdateQuestionDto
  ): Promise<ChecklistQuestion> {
    try {
      const question = await this.questionRepository.findOne({
        where: { id: questionId, vendorId }
      });

      if (!question) {
        throw new NotFoundException('Question not found or access denied');
      }

      await this.questionRepository.update(questionId, updateDto);
      
      const updatedQuestion = await this.questionRepository.findOne({
        where: { id: questionId },
        relations: ['supportingDocuments']
      });

      this.logger.log(`Updated question ${questionId} for vendor ${vendorId}`);
      return updatedQuestion;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update question ${questionId}: ${error.message}`);
      throw new BadRequestException('Failed to update question');
    }
  }

  // Add supporting document to a question
  async addSupportingDocument(
    vendorId: string,
    createDocDto: CreateSupportingDocumentDto,
    userId?: string
  ): Promise<ChecklistSupportingDocument> {
    try {
      // Verify question belongs to vendor
      const question = await this.questionRepository.findOne({
        where: { id: createDocDto.questionId, vendorId }
      });

      if (!question) {
        throw new NotFoundException('Question not found or access denied');
      }

      const document = this.documentRepository.create({
        ...createDocDto,
        vendorId,
        uploadedBy: userId
      });

      const savedDocument = await this.documentRepository.save(document);
      this.logger.log(`Added supporting document ${savedDocument.id} to question ${createDocDto.questionId}`);
      
      return savedDocument;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to add supporting document: ${error.message}`);
      throw new BadRequestException('Failed to add supporting document');
    }
  }

  // Get all questions for a vendor (for AI processing)
  async getVendorQuestions(vendorId: string, status?: QuestionStatus): Promise<ChecklistQuestion[]> {
    try {
      const whereCondition: any = { vendorId };
      if (status) {
        whereCondition.status = status;
      }

      const questions = await this.questionRepository.find({
        where: whereCondition,
        relations: ['checklist', 'supportingDocuments'],
        order: { createdAt: 'DESC' }
      });

      return questions;
    } catch (error) {
      this.logger.error(`Failed to get vendor questions: ${error.message}`);
      throw new BadRequestException('Failed to retrieve vendor questions');
    }
  }

  // Batch update questions with AI answers
  async batchUpdateQuestionsWithAnswers(
    vendorId: string,
    questionUpdates: Array<{ questionId: string; answer: string; confidence: number }>
  ): Promise<ChecklistQuestion[]> {
    try {
      const updatedQuestions: ChecklistQuestion[] = [];

      for (const update of questionUpdates) {
        const question = await this.updateQuestion(update.questionId, vendorId, {
          aiAnswer: update.answer,
          confidenceScore: update.confidence,
          status: QuestionStatus.COMPLETED
        });
        updatedQuestions.push(question);
      }

      this.logger.log(`Batch updated ${updatedQuestions.length} questions for vendor ${vendorId}`);
      return updatedQuestions;
    } catch (error) {
      this.logger.error(`Failed to batch update questions: ${error.message}`);
      throw new BadRequestException('Failed to update questions with AI answers');
    }
  }

  // Extract text content from uploaded file (placeholder for actual implementation)
  async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    // TODO: Implement actual file parsing for PDF, DOC, DOCX
    // For now, return sample questions for demonstration
    const sampleQuestions = [
      "Do you have a documented information security policy?",
      "Are user access controls implemented and regularly reviewed?",
      "Do you conduct regular security awareness training?",
      "Is data encrypted both at rest and in transit?",
      "Do you have an incident response plan in place?",
      "Are regular security assessments and penetration tests conducted?",
      "Do you have a business continuity and disaster recovery plan?",
      "Are vendor security assessments performed before onboarding?",
      "Do you maintain an inventory of all IT assets?",
      "Are software vulnerabilities managed through a formal process?"
    ];

    return sampleQuestions.join('\n');
  }

  // Parse questions from extracted text
  parseQuestionsFromText(text: string): CreateQuestionDto[] {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    return lines.map((line, index) => ({
      questionText: line.trim(),
      questionOrder: index + 1,
      status: QuestionStatus.PENDING,
      requiresDocument: Math.random() > 0.7, // Random for demo
      documentDescription: Math.random() > 0.7 ? this.getRandomDocRequirement() : undefined
    }));
  }

  private getRandomDocRequirement(): string {
    const requirements = [
      "Upload your latest security audit report",
      "Provide evidence of employee security training certificates",
      "Submit your data encryption policy document",
      "Upload incident response procedure documentation",
      "Provide your business continuity plan"
    ];
    return requirements[Math.floor(Math.random() * requirements.length)];
  }

  // Delete checklist and all associated data (vendor verification)
  async deleteChecklist(checklistId: string, vendorId: string): Promise<void> {
    try {
      const checklist = await this.getChecklist(checklistId, vendorId);
      
      await this.checklistRepository.remove(checklist);
      this.logger.log(`Deleted checklist ${checklistId} for vendor ${vendorId}`);
    } catch (error) {
      this.logger.error(`Failed to delete checklist ${checklistId}: ${error.message}`);
      throw new BadRequestException('Failed to delete checklist');
    }
  }
} 