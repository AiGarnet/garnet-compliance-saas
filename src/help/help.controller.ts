import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HelpService } from './help.service';
import { CreateHelpRequestDto, HelpRequestResponseDto } from './dto/help.dto';

@ApiTags('AI & Chatbot')
@ApiBearerAuth()
@Controller('api/help')
@UseGuards(JwtAuthGuard)
export class HelpController {
  private readonly logger = new Logger(HelpController.name);

  constructor(private readonly helpService: HelpService) {}

  @Post('request')
  @ApiOperation({ summary: 'Create a help request' })
  @ApiResponse({ status: 201, description: 'Help request created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createHelpRequest(
    @Body() createHelpRequestDto: CreateHelpRequestDto,
  ): Promise<HelpRequestResponseDto> {
    this.logger.log(
      `Creating help request for vendor ${createHelpRequestDto.vendorId}`,
    );

    try {
      const response = await this.helpService.createHelpRequest(
        createHelpRequestDto,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Error creating help request: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to process help request');
    }
  }

  @Get('vendor/:vendorId/history')
  async getVendorHelpHistory(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
  ) {
    this.logger.log(`Getting help history for vendor ${vendorId}`);

    try {
      const history = await this.helpService.getVendorHelpHistory(vendorId);
      return { history };
    } catch (error) {
      this.logger.error(
        `Error getting help history: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to get help history');
    }
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat with compliance assistant' })
  @ApiResponse({ status: 200, description: 'Chat response generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async chatWithBot(@Body() body: { question: string; vendorId: string }) {
    this.logger.log(`Chat request from vendor ${body.vendorId}`);

    try {
      const response = await this.helpService.processChatMessage(
        body.question,
        body.vendorId,
      );
      return response;
    } catch (error) {
      this.logger.error(`Error in chat: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to process chat message');
    }
  }
} 