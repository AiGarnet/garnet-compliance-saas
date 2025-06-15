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
import { CreateTrustPortalItemDto, UpdateTrustPortalItemDto } from './dto/trust-portal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('trust-portal')
@Controller('api/trust-portal')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TrustPortalController {
  constructor(private readonly trustPortalService: TrustPortalService) {}

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
} 