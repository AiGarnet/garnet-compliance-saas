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
import { VendorsService } from './vendors.service';
import { CreateVendorDto, UpdateVendorDto, VendorQuestionnaireAnswerDto, CreateVendorWithAnswersDto } from './dto/vendor.dto';
import { VendorStatus } from './entities/vendor.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('vendors')
@Controller('api/vendors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all vendors' })
  @ApiResponse({ status: 200, description: 'Returns all vendors' })
  async getAllVendors() {
    try {
      const vendors = await this.vendorsService.getAllVendors();
      return { vendors };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get vendor statistics' })
  @ApiResponse({ status: 200, description: 'Returns vendor statistics' })
  async getVendorStats() {
    try {
      const stats = await this.vendorsService.getVendorStats();
      return stats;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get vendors by status' })
  @ApiResponse({ status: 200, description: 'Returns vendors with specified status' })
  async getVendorsByStatus(@Param('status') status: string) {
    try {
      // Validate status
      if (!Object.values(VendorStatus).includes(status as VendorStatus)) {
        throw new HttpException(
          `Invalid status. Must be one of: ${Object.values(VendorStatus).join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const vendors = await this.vendorsService.getVendorsByStatus(status as VendorStatus);
      return { vendors };
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

  @Get('with-suggestions')
  @ApiOperation({ summary: 'Get vendors with AI suggestions' })
  @ApiResponse({ status: 200, description: 'Returns vendors that have AI suggestions' })
  async getVendorsWithSuggestions() {
    try {
      const vendors = await this.vendorsService.getVendorsWithSuggestions();
      return { vendors };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a vendor by ID' })
  @ApiResponse({ status: 200, description: 'Returns the vendor' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async getVendorById(@Param('id') id: string) {
    try {
      const vendor = await this.vendorsService.getVendorById(id);
      
      if (!vendor) {
        throw new HttpException(
          `Vendor with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      
      return { vendor };
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

  @Post()
  @ApiOperation({ summary: 'Create a new vendor' })
  @ApiResponse({ status: 201, description: 'Vendor created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createVendor(@Body() createVendorDto: CreateVendorDto) {
    try {
      const vendor = await this.vendorsService.createVendor(createVendorDto);
      return { vendor };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('with-answers')
  @ApiOperation({ summary: 'Create a new vendor with questionnaire answers' })
  @ApiResponse({ status: 201, description: 'Vendor created with answers successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createVendorWithAnswers(@Body() createVendorWithAnswersDto: CreateVendorWithAnswersDto) {
    try {
      const vendor = await this.vendorsService.createVendorWithAnswers(createVendorWithAnswersDto);
      return { vendor };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a vendor' })
  @ApiResponse({ status: 200, description: 'Vendor updated successfully' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async updateVendor(@Param('id') id: string, @Body() updateVendorDto: UpdateVendorDto) {
    try {
      const vendor = await this.vendorsService.updateVendor(id, updateVendorDto);
      
      if (!vendor) {
        throw new HttpException(
          `Vendor with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      
      return { vendor };
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
  @ApiOperation({ summary: 'Delete a vendor' })
  @ApiResponse({ status: 200, description: 'Vendor deleted successfully' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async deleteVendor(@Param('id') id: string) {
    try {
      const deleted = await this.vendorsService.deleteVendor(id);
      
      if (!deleted) {
        throw new HttpException(
          `Vendor with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      
      return { message: `Vendor with ID ${id} has been deleted` };
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

  @Post(':id/answers')
  @ApiOperation({ summary: 'Save questionnaire answers for a vendor' })
  @ApiResponse({ status: 200, description: 'Answers saved successfully' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async saveVendorQuestionnaireAnswers(
    @Param('id') id: string,
    @Body() answers: VendorQuestionnaireAnswerDto[],
  ) {
    try {
      const savedAnswers = await this.vendorsService.saveVendorQuestionnaireAnswers(id, answers);
      return { answers: savedAnswers };
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