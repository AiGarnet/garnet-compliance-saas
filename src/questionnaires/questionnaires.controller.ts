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
import { CreateQuestionnaireDto, UpdateQuestionnaireDto, UpdateQuestionDto } from './dto/questionnaire.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('questionnaires')
@Controller('api/questionnaires')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuestionnairesController {
  constructor(private readonly questionnairesService: QuestionnairesService) {}

  @Post()
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
} 