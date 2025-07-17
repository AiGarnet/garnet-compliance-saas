import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuestionnairesService } from './questionnaires.service';
import { CreateQuestionnaireDto, UpdateQuestionnaireDto, UpdateQuestionDto, SubmitQuestionnaireDto } from './dto/questionnaire.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('questionnaires')
@Controller('api/questionnaires')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuestionnairesController {
  constructor(private readonly questionnairesService: QuestionnairesService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new questionnaire' })
  @ApiResponse({ status: 201, description: 'Questionnaire created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createQuestionnaire(@Body() createQuestionnaireDto: CreateQuestionnaireDto) {
    try {
      const questionnaire = await this.questionnairesService.createQuestionnaire(createQuestionnaireDto);
      return { questionnaire };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all questionnaires' })
  @ApiResponse({ status: 200, description: 'Returns all questionnaires' })
  async getAllQuestionnaires() {
    try {
      const questionnaires = await this.questionnairesService.getAllQuestionnaires();
      return { questionnaires };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('vendor/:vendorId')
  @Public()
  @ApiOperation({ summary: 'Get questionnaires for a specific vendor' })
  @ApiResponse({ status: 200, description: 'Returns questionnaires for the vendor' })
  async getQuestionnairesByVendor(@Param('vendorId') vendorId: string) {
    try {
      const questionnaires = await this.questionnairesService.getQuestionnairesByVendor(vendorId);
      return { questionnaires };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific questionnaire by ID' })
  @ApiResponse({ status: 200, description: 'Returns the questionnaire' })
  @ApiResponse({ status: 404, description: 'Questionnaire not found' })
  async getQuestionnaireById(@Param('id') id: string) {
    try {
      const questionnaire = await this.questionnairesService.getQuestionnaireById(id);
      
      if (!questionnaire) {
        throw new HttpException(
          'Questionnaire not found',
          HttpStatus.NOT_FOUND,
        );
      }
      
      return { questionnaire };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/questions')
  @Public()
  @ApiOperation({ summary: 'Get questions for a specific questionnaire' })
  @ApiResponse({ status: 200, description: 'Returns the questions' })
  async getQuestionnaireQuestions(@Param('id') id: string) {
    try {
      const questions = await this.questionnairesService.getQuestionnaireQuestions(id);
      return { questions };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update a specific questionnaire' })
  @ApiResponse({ status: 200, description: 'Questionnaire updated successfully' })
  @ApiResponse({ status: 404, description: 'Questionnaire not found' })
  async updateQuestionnaire(@Param('id') id: string, @Body() updateQuestionnaireDto: UpdateQuestionnaireDto) {
    try {
      const questionnaire = await this.questionnairesService.updateQuestionnaire(id, updateQuestionnaireDto);
      
      if (!questionnaire) {
        throw new HttpException(
          'Questionnaire not found',
          HttpStatus.NOT_FOUND,
        );
      }
      
      return { questionnaire };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/questions/:questionId')
  @Public()
  @ApiOperation({ summary: 'Update a specific question in a questionnaire' })
  @ApiResponse({ status: 200, description: 'Question updated successfully' })
  @ApiResponse({ status: 404, description: 'Question or questionnaire not found' })
  async updateQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    try {
      const question = await this.questionnairesService.updateQuestion(id, questionId, updateQuestionDto);
      
      if (!question) {
        throw new HttpException(
          'Question or questionnaire not found',
          HttpStatus.NOT_FOUND,
        );
      }
      
      return { question };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a questionnaire' })
  @ApiResponse({ status: 200, description: 'Questionnaire deleted successfully' })
  @ApiResponse({ status: 404, description: 'Questionnaire not found' })
  async deleteQuestionnaire(@Param('id') id: string) {
    try {
      const deleted = await this.questionnairesService.deleteQuestionnaire(id);
      
      if (!deleted) {
        throw new HttpException(
          'Questionnaire not found',
          HttpStatus.NOT_FOUND,
        );
      }
      
      return { message: 'Questionnaire deleted successfully' };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Public()
  @Post(':id/vendor/:vendorId/answers')
  @ApiOperation({ summary: 'Save vendor answers for a questionnaire' })
  @ApiResponse({ status: 201, description: 'Vendor answers saved successfully' })
  @ApiResponse({ status: 404, description: 'Questionnaire or vendor not found' })
  async saveVendorAnswers(
    @Param('id') questionnaireId: string,
    @Param('vendorId') vendorId: string,
    @Body() answers: Array<{ questionId?: string; question: string; answer: string }>
  ) {
    try {
      const savedAnswers = await this.questionnairesService.saveVendorAnswersForQuestionnaire(
        questionnaireId,
        vendorId,
        answers
      );
      
      return { 
        message: 'Vendor answers saved successfully',
        answers: savedAnswers 
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Public()
  @Get('vendor/:vendorId/with-answers')
  @ApiOperation({ summary: 'Get questionnaires with answers for a specific vendor' })
  @ApiResponse({ status: 200, description: 'Returns questionnaires with vendor answers' })
  async getQuestionnairesWithAnswersForVendor(@Param('vendorId') vendorId: string) {
    try {
      const questionnaires = await this.questionnairesService.getQuestionnairesWithAnswersForVendor(vendorId);
      return { questionnaires };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Public()
  @Get('vendor/:vendorId/answers/:questionId')
  @ApiOperation({ summary: 'Get a specific vendor answer by question ID' })
  @ApiResponse({ status: 200, description: 'Returns the vendor answer' })
  @ApiResponse({ status: 404, description: 'Answer not found' })
  async getVendorAnswer(
    @Param('vendorId') vendorId: string,
    @Param('questionId') questionId: string
  ) {
    try {
      const answer = await this.questionnairesService.getVendorAnswer(vendorId, questionId);
      if (!answer) {
        throw new HttpException('Answer not found', HttpStatus.NOT_FOUND);
      }
      return { answer };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Public()
  @Post('vendor/:vendorId/answers')
  @ApiOperation({ summary: 'Create a new vendor answer' })
  @ApiResponse({ status: 201, description: 'Answer created successfully' })
  async createVendorAnswer(
    @Param('vendorId') vendorId: string,
    @Body() answerData: {
      vendor_id: number;
      question_id: string;
      question: string;
      answer: string;
      status?: string;
      question_title?: string;
    }
  ) {
    try {
      const answer = await this.questionnairesService.createVendorAnswer(answerData);
      return { 
        message: 'Answer created successfully',
        answer 
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Public()
  @Put('vendor/:vendorId/answers/:questionId')
  @ApiOperation({ summary: 'Update a vendor answer' })
  @ApiResponse({ status: 200, description: 'Answer updated successfully' })
  @ApiResponse({ status: 404, description: 'Answer not found' })
  async updateVendorAnswer(
    @Param('vendorId') vendorId: string,
    @Param('questionId') questionId: string,
    @Body() answerData: {
      question?: string;
      answer?: string;
      status?: string;
      question_title?: string;
    }
  ) {
    try {
      const answer = await this.questionnairesService.updateVendorAnswer(vendorId, questionId, answerData);
      if (!answer) {
        throw new HttpException('Answer not found', HttpStatus.NOT_FOUND);
      }
      return { 
        message: 'Answer updated successfully',
        answer 
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Public()
  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit questionnaire for enterprise review' })
  @ApiResponse({ status: 200, description: 'Questionnaire submitted successfully' })
  @ApiResponse({ status: 404, description: 'Questionnaire not found' })
  @ApiResponse({ status: 400, description: 'Questionnaire not ready for submission' })
  async submitQuestionnaireForReview(
    @Param('id') questionnaireId: string,
    @Body() submitData: SubmitQuestionnaireDto
  ) {
    try {
      const submission = await this.questionnairesService.submitQuestionnaireForReview(
        questionnaireId,
        submitData
      );
      
      return { 
        message: 'Questionnaire submitted for enterprise review successfully',
        submission,
        trustPortalUrl: `/trust-portal/vendor/${submitData.vendorId}?submission=${submission.id}`
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 