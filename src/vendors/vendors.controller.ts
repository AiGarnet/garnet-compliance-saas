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
  Patch,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { CreateVendorDto, UpdateVendorDto, VendorQuestionnaireAnswerDto, CreateVendorWithAnswersDto, CreateVendorWorkDto, UpdateVendorWorkDto, ShareToTrustPortalDto, UpdateQuestionnaireAnswerStatusDto } from './dto/vendor.dto';
import { VendorStatus } from './entities/vendor.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('vendors')
@Controller('api/vendors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Public()
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

  @Public()
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

  @Public()
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

  @Public()
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

  @Public()
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

  @Public()
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

  @Public()
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

  @Public()
  @Get(':id/answers')
  @ApiOperation({ summary: 'Get questionnaire answers for a vendor' })
  @ApiResponse({ status: 200, description: 'Returns vendor questionnaire answers' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async getVendorQuestionnaireAnswers(@Param('id') id: string) {
    try {
      const answers = await this.vendorsService.getVendorQuestionnaireAnswers(id);
      return { answers };
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

  // Vendor Work Management Endpoints

  @Public()
  @Post(':id/works')
  @ApiOperation({ summary: 'Create a new work submission for a vendor' })
  @ApiResponse({ status: 201, description: 'Work created successfully' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async createVendorWork(
    @Param('id') id: string,
    @Body() createVendorWorkDto: CreateVendorWorkDto,
  ) {
    try {
      const work = await this.vendorsService.createVendorWork(id, createVendorWorkDto);
      return { work };
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
  @Get(':id/works')
  @ApiOperation({ summary: 'Get all work submissions for a vendor' })
  @ApiResponse({ status: 200, description: 'Returns vendor works' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async getVendorWorks(@Param('id') id: string) {
    try {
      const works = await this.vendorsService.getVendorWorks(id);
      return { works };
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
  @Get(':id/works/:workId')
  @ApiOperation({ summary: 'Get a specific work submission for a vendor' })
  @ApiResponse({ status: 200, description: 'Returns the work' })
  @ApiResponse({ status: 404, description: 'Vendor or work not found' })
  async getVendorWorkById(
    @Param('id') id: string,
    @Param('workId') workId: string,
  ) {
    try {
      const work = await this.vendorsService.getVendorWorkById(id, workId);
      
      if (!work) {
        throw new HttpException(
          `Work with ID ${workId} not found for vendor ${id}`,
          HttpStatus.NOT_FOUND,
        );
      }
      
      return { work };
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
  @Put(':id/works/:workId')
  @ApiOperation({ summary: 'Update a work submission for a vendor' })
  @ApiResponse({ status: 200, description: 'Work updated successfully' })
  @ApiResponse({ status: 404, description: 'Vendor or work not found' })
  async updateVendorWork(
    @Param('id') id: string,
    @Param('workId') workId: string,
    @Body() updateVendorWorkDto: UpdateVendorWorkDto,
  ) {
    try {
      const work = await this.vendorsService.updateVendorWork(id, workId, updateVendorWorkDto);
      
      if (!work) {
        throw new HttpException(
          `Work with ID ${workId} not found for vendor ${id}`,
          HttpStatus.NOT_FOUND,
        );
      }
      
      return { work };
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
  @Delete(':id/works/:workId')
  @ApiOperation({ summary: 'Delete a work submission for a vendor' })
  @ApiResponse({ status: 200, description: 'Work deleted successfully' })
  @ApiResponse({ status: 404, description: 'Vendor or work not found' })
  async deleteVendorWork(
    @Param('id') id: string,
    @Param('workId') workId: string,
  ) {
    try {
      const deleted = await this.vendorsService.deleteVendorWork(id, workId);
      
      if (!deleted) {
        throw new HttpException(
          `Work with ID ${workId} not found for vendor ${id}`,
          HttpStatus.NOT_FOUND,
        );
      }
      
      return { message: `Work with ID ${workId} has been deleted` };
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

  // Trust Portal Management Endpoints

  @Post(':id/trust-portal/invite')
  @ApiOperation({ summary: 'Generate trust portal invite link for a vendor' })
  @ApiResponse({ status: 200, description: 'Invite link generated successfully' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async generateTrustPortalInviteLink(@Param('id') id: string, @Request() req) {
    try {
      // Get user info from JWT token
      const userEmail = req.user?.email;
      const userFullName = req.user?.full_name;
      
      const result = await this.vendorsService.generateTrustPortalInviteLink(id, userEmail, userFullName);
      return result;
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
  @Patch(':id/answers/:answerId/share')
  @ApiOperation({ summary: 'Update share to trust portal status for questionnaire answer' })
  @ApiResponse({ status: 200, description: 'Share status updated successfully' })
  @ApiResponse({ status: 404, description: 'Vendor or answer not found' })
  async updateQuestionnaireAnswerShareStatus(
    @Param('id') id: string,
    @Param('answerId') answerId: string,
    @Body() shareDto: ShareToTrustPortalDto,
  ) {
    try {
      const updated = await this.vendorsService.updateQuestionnaireAnswerShareStatus(
        id,
        answerId,
        shareDto.shareToTrustPortal,
      );
      
      if (!updated) {
        throw new HttpException(
          `Answer with ID ${answerId} not found for vendor ${id}`,
          HttpStatus.NOT_FOUND,
        );
      }
      
      return { message: 'Share status updated successfully' };
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
  @Patch(':id/answers/:answerId/status')
  @ApiOperation({ summary: 'Update questionnaire answer completion status' })
  @ApiResponse({ status: 200, description: 'Answer status updated successfully' })
  @ApiResponse({ status: 404, description: 'Vendor or answer not found' })
  async updateQuestionnaireAnswerStatus(
    @Param('id') id: string,
    @Param('answerId') answerId: string,
    @Body() statusDto: UpdateQuestionnaireAnswerStatusDto,
  ) {
    try {
      console.log(`Updating status for vendor ${id}, answer ${answerId}, status: ${statusDto.status}`);
      
      const updated = await this.vendorsService.updateQuestionnaireAnswerStatus(
        id,
        answerId,
        statusDto.status,
        statusDto.shareToTrustPortal,
      );

      console.log(`Update result: ${updated}`);

      if (!updated) {
        throw new HttpException(
          `Answer with ID ${answerId} not found for vendor ${id}`,
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        message: 'Answer status updated successfully',
        status: statusDto.status,
        shareToTrustPortal: statusDto.shareToTrustPortal,
        vendorId: id,
        answerId: answerId,
      };
    } catch (error: any) {
      console.error(`Error updating status: ${error.message}`, error);
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
  @Get(':id/trust-portal')
  @ApiOperation({ summary: 'Get trust portal data for a vendor (public view)' })
  @ApiResponse({ status: 200, description: 'Returns trust portal data' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async getTrustPortalData(@Param('id') id: string, @Request() req) {
    try {
      // For authenticated requests, get user info from JWT token
      const userEmail = req.user?.email;
      const userFullName = req.user?.full_name;
      
      const data = await this.vendorsService.getTrustPortalData(id, userEmail, userFullName);
      return data;
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
  @Get('public-test')
  @ApiOperation({ summary: 'Test public endpoint' })
  @ApiResponse({ status: 200, description: 'Test successful' })
  async testPublicEndpoint() {
    return { message: 'Public endpoint working', timestamp: new Date().toISOString() };
  }
} 