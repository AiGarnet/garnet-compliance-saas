import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TrustPortalService } from './trust-portal.service';
import { 
  CreateTrustPortalItemDto, 
  UpdateTrustPortalItemDto,
  CreateTrustPortalFeedbackDto,
  CreateFeedbackResponseDto,
  UpdateFeedbackStatusDto,
  CreateSharedDocumentDto
} from './dto/trust-portal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { VendorsService } from '../vendors/vendors.service';

@ApiTags('trust-portal')
@Controller('api/trust-portal')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TrustPortalController {
  constructor(
    private readonly trustPortalService: TrustPortalService,
    private readonly vendorsService: VendorsService
  ) {}

  @Get('vendors')
  @ApiOperation({ summary: 'Get all vendors that have trust portal items' })
  @ApiResponse({ status: 200, description: 'Returns vendors with trust portal items' })
  async getVendorsWithTrustPortalItems() {
    try {
      const vendors = await this.trustPortalService.getVendorsWithTrustPortalItems();
      return vendors;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch vendors',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('items')
  @ApiOperation({ summary: 'Get all trust portal items for a specific vendor' })
  @ApiResponse({ status: 200, description: 'Returns trust portal items for the vendor' })
  @ApiResponse({ status: 400, description: 'Vendor ID is required' })
  @ApiQuery({ name: 'vendorId', required: true, type: Number })
  async getVendorTrustPortalItems(@Query('vendorId', ParseIntPipe) vendorId: number) {
    try {
      if (!vendorId) {
        throw new HttpException('Vendor ID is required', HttpStatus.BAD_REQUEST);
      }

      const items = await this.trustPortalService.getVendorTrustPortalItems(vendorId);
      return items;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to fetch trust portal items',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('items')
  @ApiOperation({ summary: 'Add a new item to the trust portal' })
  @ApiResponse({ status: 201, description: 'Trust portal item created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async addTrustPortalItem(@Body() createTrustPortalItemDto: CreateTrustPortalItemDto) {
    try {
      const newItem = await this.trustPortalService.addTrustPortalItem(createTrustPortalItemDto);
      return newItem;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to add trust portal item',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get a specific trust portal item by ID' })
  @ApiResponse({ status: 200, description: 'Returns the trust portal item' })
  @ApiResponse({ status: 404, description: 'Trust portal item not found' })
  async getTrustPortalItemById(@Param('id', ParseIntPipe) id: number) {
    try {
      const item = await this.trustPortalService.getTrustPortalItemById(id);
      return item;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to fetch trust portal item',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('items/:id')
  @ApiOperation({ summary: 'Update a trust portal item' })
  @ApiResponse({ status: 200, description: 'Trust portal item updated successfully' })
  @ApiResponse({ status: 404, description: 'Trust portal item not found' })
  async updateTrustPortalItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTrustPortalItemDto: UpdateTrustPortalItemDto,
  ) {
    try {
      const updatedItem = await this.trustPortalService.updateTrustPortalItem(id, updateTrustPortalItemDto);
      return updatedItem;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to update trust portal item',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Delete a trust portal item' })
  @ApiResponse({ status: 200, description: 'Trust portal item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Trust portal item not found' })
  async deleteTrustPortalItem(@Param('id', ParseIntPipe) id: number) {
    try {
      const deleted = await this.trustPortalService.deleteTrustPortalItem(id);
      
      if (!deleted) {
        throw new HttpException('Trust portal item not found', HttpStatus.NOT_FOUND);
      }

      return { message: 'Trust portal item deleted successfully' };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to delete trust portal item',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('items/category/:category')
  @ApiOperation({ summary: 'Get trust portal items by category' })
  @ApiResponse({ status: 200, description: 'Returns trust portal items for the category' })
  async getTrustPortalItemsByCategory(@Param('category') category: string) {
    try {
      const items = await this.trustPortalService.getTrustPortalItemsByCategory(category);
      return items;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch trust portal items by category',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Public()
  @Get('invite/:token')
  @ApiOperation({ summary: 'Get trust portal data via invite token (public access)' })
  @ApiResponse({ status: 200, description: 'Returns trust portal data for invited access' })
  @ApiResponse({ status: 404, description: 'Invalid or expired invite token' })
  async getTrustPortalByInviteToken(@Param('token') token: string) {
    try {
      // Get vendor by invite token (this will be implemented in vendors service)
      const vendor = await this.vendorsService.getVendorByInviteToken(token);
      
      if (!vendor) {
        throw new HttpException(
          'Invalid or expired invite token',
          HttpStatus.NOT_FOUND,
        );
      }

      // Get trust portal data for the vendor (public view - no private data)
      const trustPortalData = await this.trustPortalService.getVendorTrustPortalData(vendor.vendorId, false);
      
      return {
        ...trustPortalData,
        inviteToken: token
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

  @Get('vendor/:vendorId')
  @ApiOperation({ summary: 'Get complete trust portal data for a vendor' })
  @ApiResponse({ status: 200, description: 'Returns complete trust portal data' })
  async getVendorTrustPortalData(@Param('vendorId', ParseIntPipe) vendorId: number) {
    try {
      const data = await this.trustPortalService.getVendorTrustPortalData(vendorId, true);
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to fetch trust portal data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Feedback Management
  @Public()
  @Post('feedback')
  @ApiOperation({ summary: 'Submit feedback from enterprise (public access)' })
  @ApiResponse({ status: 201, description: 'Feedback submitted successfully' })
  async createFeedback(@Body() createFeedbackDto: CreateTrustPortalFeedbackDto) {
    try {
      const feedback = await this.trustPortalService.createFeedback(createFeedbackDto);
      return feedback;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to submit feedback',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('vendor/:vendorId/feedback')
  @ApiOperation({ summary: 'Get feedback for a vendor' })
  @ApiResponse({ status: 200, description: 'Returns feedback for the vendor' })
  async getVendorFeedback(@Param('vendorId', ParseIntPipe) vendorId: number) {
    try {
      const feedback = await this.trustPortalService.getVendorFeedback(vendorId);
      return feedback;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch feedback',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('feedback/:feedbackId/response')
  @ApiOperation({ summary: 'Add response to feedback' })
  @ApiResponse({ status: 201, description: 'Response added successfully' })
  async addFeedbackResponse(
    @Param('feedbackId', ParseIntPipe) feedbackId: number,
    @Body() createResponseDto: CreateFeedbackResponseDto
  ) {
    try {
      // Set feedbackId from URL parameter
      createResponseDto.feedbackId = feedbackId;
      const response = await this.trustPortalService.addFeedbackResponse(createResponseDto);
      return response;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to add response',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('feedback/:feedbackId/status')
  @ApiOperation({ summary: 'Update feedback status' })
  @ApiResponse({ status: 200, description: 'Feedback status updated successfully' })
  async updateFeedbackStatus(
    @Param('feedbackId', ParseIntPipe) feedbackId: number,
    @Body() updateStatusDto: UpdateFeedbackStatusDto
  ) {
    try {
      const feedback = await this.trustPortalService.updateFeedbackStatus(feedbackId, updateStatusDto);
      return feedback;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to update feedback status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Shared Documents Management
  @Post('documents')
  @ApiOperation({ summary: 'Add a document to trust portal' })
  @ApiResponse({ status: 201, description: 'Document added successfully' })
  async createSharedDocument(@Body() createDocumentDto: CreateSharedDocumentDto) {
    try {
      const document = await this.trustPortalService.createSharedDocument(createDocumentDto);
      return document;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to add document',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('vendor/:vendorId/documents')
  @ApiOperation({ summary: 'Get shared documents for a vendor' })
  @ApiResponse({ status: 200, description: 'Returns shared documents for the vendor' })
  async getVendorSharedDocuments(@Param('vendorId', ParseIntPipe) vendorId: number) {
    try {
      const data = await this.trustPortalService.getVendorTrustPortalData(vendorId, false);
      return data.sharedDocuments;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch documents',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 