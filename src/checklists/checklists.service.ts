import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
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
import { DigitalOceanSpacesService } from '../common/services/digitalocean-spaces.service';
import { DatabaseService } from '../database/database.service';

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
    private spacesService: DigitalOceanSpacesService,
    private databaseService: DatabaseService,
  ) {}

  // Generate a unique checklist name for a vendor
  private async generateUniqueChecklistName(vendorId: string, baseName: string): Promise<string> {
    let uniqueName = baseName;
    let counter = 1;

    while (true) {
      const existingChecklist = await this.checklistRepository.findOne({
        where: { vendorId, name: uniqueName }
      });

      if (!existingChecklist) {
        return uniqueName;
      }

      // If name exists, append counter
      const nameWithoutExtension = baseName.replace(/\.[^/.]+$/, '');
      const extension = baseName.includes('.') ? baseName.substring(baseName.lastIndexOf('.')) : '';
      uniqueName = `${nameWithoutExtension} (${counter})${extension}`;
      counter++;

      // Safety check to prevent infinite loop
      if (counter > 100) {
        uniqueName = `${nameWithoutExtension}_${Date.now()}${extension}`;
        break;
      }
    }

    return uniqueName;
  }

  // Create a new checklist for a vendor
  async createChecklist(createChecklistDto: CreateChecklistDto, userId?: string): Promise<Checklist> {
    try {
      // Generate unique name to avoid constraint violations
      const uniqueName = await this.generateUniqueChecklistName(
        createChecklistDto.vendorId, 
        createChecklistDto.name
      );

      const checklist = this.checklistRepository.create({
        ...createChecklistDto,
        name: uniqueName,
        uploadedBy: userId,
        extractionStatus: ChecklistExtractionStatus.PENDING,
      });

      const savedChecklist = await this.checklistRepository.save(checklist);
      this.logger.log(`Created checklist ${savedChecklist.id} for vendor ${createChecklistDto.vendorId} with name: ${uniqueName}`);
      
      return savedChecklist;
    } catch (error) {
      this.logger.error(`Failed to create checklist: ${error.message}`);
      throw new BadRequestException('Failed to create checklist');
    }
  }

  // Upload and process checklist file with DigitalOcean Spaces integration
  async uploadChecklistFile(
    file: Express.Multer.File,
    vendorId: string,
    name?: string,
    userId?: string
  ): Promise<{ checklist: Checklist; questions: ChecklistQuestion[] }> {
    try {
      // Step 1: Create checklist record
      const createChecklistDto: CreateChecklistDto = {
        vendorId,
        name: name || file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        originalFilename: file.originalname,
        extractionStatus: ChecklistExtractionStatus.EXTRACTING,
      };

      const checklist = await this.createChecklist(createChecklistDto, userId);

      // Step 2: Extract text and parse questions
      const extractedText = await this.extractTextFromFile(file);
      const questionDtos = this.parseQuestionsFromText(extractedText);

      // Step 3: Save questions to database
      const questions = await this.addQuestionsToChecklist(checklist.id, vendorId, questionDtos);

      // Step 4: Update checklist status
      let spacesKey: string | undefined;
      let spacesUrl: string | undefined;

      // Only upload to Spaces if we have extracted content
      if (extractedText && questions.length > 0) {
        try {
          // Prepare checklist data for upload to Spaces
          const checklistData = {
            checklist: {
              id: checklist.id,
              vendorId: checklist.vendorId,
              name: checklist.name,
              originalFilename: checklist.originalFilename,
              fileType: checklist.fileType,
              fileSize: checklist.fileSize,
              uploadDate: checklist.uploadDate,
              extractionStatus: checklist.extractionStatus,
            },
            questions: questions.map(q => ({
              id: q.id,
              questionText: q.questionText,
              questionOrder: q.questionOrder,
              status: q.status,
              requiresDocument: q.requiresDocument,
              documentDescription: q.documentDescription,
            })),
            extractedText,
            metadata: {
              extractionDate: new Date().toISOString(),
              questionCount: questions.length,
              userId,
            }
          };

          // Upload to DigitalOcean Spaces
          const uploadResult = await this.spacesService.uploadChecklist(
            checklistData,
            vendorId,
            checklist.id,
            file.originalname
          );

          spacesKey = uploadResult.key;
          spacesUrl = uploadResult.url;
          this.logger.log(`Successfully uploaded checklist ${checklist.id} to Spaces: ${uploadResult.key}`);
        } catch (spacesError) {
          this.logger.error(`Failed to upload to Spaces, but continuing: ${spacesError.message}`);
          // Continue without Spaces upload - checklist will still work
        }
      }

      // Step 5: Update checklist with final status and storage information
      await this.checklistRepository.update(checklist.id, {
        extractionStatus: ChecklistExtractionStatus.COMPLETED,
        spacesKey,
        spacesUrl,
      });

      return {
        checklist: { ...checklist, extractionStatus: ChecklistExtractionStatus.COMPLETED },
        questions
      };

    } catch (error) {
      this.logger.error(`Failed to upload checklist file: ${error.message}`);
      throw new BadRequestException(`Failed to process checklist file: ${error.message}`);
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

  // Upload supporting document file to DigitalOcean Spaces
  async uploadSupportingDocumentFile(
    file: Express.Multer.File,
    vendorId: string,
    questionId: string,
    userId?: string
  ): Promise<ChecklistSupportingDocument> {
    try {
      // Check if this is a standalone upload (doesn't require question verification)
      const isStandaloneUpload = questionId.startsWith('standalone-');
      let actualQuestionId = questionId;
      
      if (isStandaloneUpload) {
        // Generate a proper UUID for standalone uploads to satisfy database constraints
        actualQuestionId = uuidv4();
        this.logger.log(`Converting standalone questionId ${questionId} to UUID ${actualQuestionId}`);
      } else {
        // Verify question belongs to vendor for question-specific uploads
        const question = await this.questionRepository.findOne({
          where: { id: questionId, vendorId }
        });

        if (!question) {
          throw new NotFoundException('Question not found or access denied');
        }
      }

      // Upload file to DigitalOcean Spaces (use original questionId for file naming)
      const uploadResult = await this.spacesService.uploadSupportingDocument(
        file.buffer,
        file.originalname,
        file.mimetype,
        vendorId,
        questionId // Use original questionId for file naming consistency
      );

      // Create document record with Spaces information
      const createDocDto: CreateSupportingDocumentDto = {
        questionId: actualQuestionId, // Use UUID for database
        filename: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        filePath: uploadResult.url, // Store the direct URL for backwards compatibility
      };

      const document = this.documentRepository.create({
        ...createDocDto,
        vendorId,
        uploadedBy: userId,
        spacesKey: uploadResult.key,
        spacesUrl: uploadResult.url,
      });

      const savedDocument = await this.documentRepository.save(document);
      
      this.logger.log(`Uploaded supporting document ${savedDocument.id} to Spaces: ${uploadResult.key}`);
      
      return savedDocument;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to upload supporting document: ${error.message}`);
      throw new BadRequestException(`Failed to upload supporting document: ${error.message}`);
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

  // Extract text content from uploaded file
  async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    try {
      // For now, convert buffer to string assuming text-based files
      // TODO: Implement proper parsing for PDF, DOC, DOCX files using libraries
      if (file.mimetype === 'text/plain' || file.mimetype === 'text/csv') {
        return file.buffer.toString('utf-8');
      } else if (file.mimetype === 'application/json') {
        const jsonData = JSON.parse(file.buffer.toString('utf-8'));
        // Extract questions from JSON structure
        if (Array.isArray(jsonData)) {
          return jsonData.map(item => typeof item === 'string' ? item : item.question || JSON.stringify(item)).join('\n');
        } else if (jsonData.questions && Array.isArray(jsonData.questions)) {
          return jsonData.questions.map(q => typeof q === 'string' ? q : q.text || q.question || JSON.stringify(q)).join('\n');
        }
        return JSON.stringify(jsonData, null, 2);
      }
      
      // For unsupported file types, return empty string (no questions)
      this.logger.warn(`Unsupported file type for text extraction: ${file.mimetype}`);
      return '';
    } catch (error) {
      this.logger.error(`Failed to extract text from file: ${error.message}`);
      return '';
    }
  }

  // Parse questions from extracted text
  parseQuestionsFromText(text: string): CreateQuestionDto[] {
    if (!text || text.trim().length === 0) {
      this.logger.warn('No text content found in uploaded file for question extraction');
      return [];
    }

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
      // First, verify the checklist belongs to the vendor
      const checklist = await this.getChecklist(checklistId, vendorId);
      
      this.logger.log(`Starting deletion of checklist ${checklistId} for vendor ${vendorId}`);
      
      // Get all questions for this checklist
      const questions = await this.questionRepository.find({
        where: { checklistId, vendorId },
        relations: ['supportingDocuments']
      });
      
      this.logger.log(`Found ${questions.length} questions to delete`);
      
      // Delete supporting documents first (both from database and DigitalOcean Spaces)
      for (const question of questions) {
        if (question.supportingDocuments && question.supportingDocuments.length > 0) {
          this.logger.log(`Deleting ${question.supportingDocuments.length} supporting documents for question ${question.id}`);
          
          for (const doc of question.supportingDocuments) {
            try {
              // Delete from DigitalOcean Spaces if it exists
              if (doc.spacesKey) {
                await this.spacesService.deleteFile(doc.spacesKey);
                this.logger.log(`Deleted file from Spaces: ${doc.spacesKey}`);
              }
            } catch (spacesError) {
              this.logger.warn(`Failed to delete file from Spaces: ${doc.spacesKey}, error: ${spacesError.message}`);
              // Continue with database deletion even if Spaces deletion fails
            }
            
            // Delete from database
            await this.documentRepository.remove(doc);
          }
        }
      }
      
      // Delete all questions for this checklist
      if (questions.length > 0) {
        await this.questionRepository.remove(questions);
        this.logger.log(`Deleted ${questions.length} questions`);
      }
      
      // Finally, delete the checklist itself
      // Also delete the checklist file from DigitalOcean Spaces if it exists
      if (checklist.spacesKey) {
        try {
          await this.spacesService.deleteFile(checklist.spacesKey);
          this.logger.log(`Deleted checklist file from Spaces: ${checklist.spacesKey}`);
        } catch (spacesError) {
          this.logger.warn(`Failed to delete checklist file from Spaces: ${checklist.spacesKey}, error: ${spacesError.message}`);
          // Continue with database deletion even if Spaces deletion fails
        }
      }
      
      await this.checklistRepository.remove(checklist);
      
      this.logger.log(`Successfully deleted checklist ${checklistId} and all associated data for vendor ${vendorId}`);
    } catch (error) {
      this.logger.error(`Failed to delete checklist ${checklistId}: ${error.message}`);
      throw new BadRequestException(`Failed to delete checklist: ${error.message}`);
    }
  }

  // Sync checklist questions to vendor_questionnaire_answers table for questionnaire chat interface
  async syncQuestionsToQuestionnaire(checklistId: string, vendorId: string): Promise<void> {
    try {
      // Get the checklist and its questions
      const checklist = await this.getChecklist(checklistId, vendorId);
      const questions = await this.getChecklistQuestions(checklistId, vendorId);

      if (questions.length === 0) {
        this.logger.warn(`No questions found for checklist ${checklistId}`);
        return;
      }

      // Create questionnaire title entry
      const titleQuery = `
        INSERT INTO vendor_questionnaire_answers (
          id, vendor_id, question_id, question, answer, status, question_title, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW()
        )
        ON CONFLICT (vendor_id, question_id) DO UPDATE SET
          answer = EXCLUDED.answer,
          status = EXCLUDED.status,
          updated_at = NOW()
      `;

      await this.databaseService.query(titleQuery, [
        vendorId,
        `CHECKLIST_${checklistId}`,
        '__QUESTIONNAIRE_TITLE__',
        checklist.name,
        'Metadata',
        checklist.name
      ]);

      // Sync each question to vendor_questionnaire_answers
      for (const question of questions) {
        const syncQuery = `
          INSERT INTO vendor_questionnaire_answers (
            id, vendor_id, question_id, question, answer, status, question_title, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW()
          )
          ON CONFLICT (vendor_id, question_id) DO UPDATE SET
            question = EXCLUDED.question,
            answer = EXCLUDED.answer,
            status = EXCLUDED.status,
            question_title = EXCLUDED.question_title,
            updated_at = NOW()
        `;

        // Map statuses between systems
        let questionnaireStatus = 'Not Started';
        if (question.status === 'completed' && question.aiAnswer) {
          questionnaireStatus = 'Completed';
        } else if (question.status === 'in-progress') {
          questionnaireStatus = 'In Progress';
        } else if (question.status === 'pending') {
          questionnaireStatus = 'Pending';
        } else if (question.status === 'needs-support') {
          questionnaireStatus = 'Needs Support';
        }

        await this.databaseService.query(syncQuery, [
          vendorId,
          question.id, // Use checklist question ID as question_id
          question.questionText,
          question.aiAnswer || '',
          questionnaireStatus,
          checklist.name
        ]);
      }

      this.logger.log(`Successfully synced ${questions.length} questions from checklist ${checklistId} to questionnaire system`);
    } catch (error) {
      this.logger.error(`Failed to sync questions to questionnaire: ${error.message}`);
      throw new BadRequestException('Failed to sync questions to questionnaire system');
    }
  }


} 