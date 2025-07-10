import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  HttpException,
  UseGuards,
  Put,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EvidenceService } from './evidence.service';
import { CreateEvidenceFileDto, UpdateEvidenceFileDto, EvidenceFileResponseDto } from './dto/evidence.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { EvidenceFile } from './entities/evidence.entity';

@ApiTags('evidence')
@Controller('api')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post('vendors/:vendorId/evidence')
  @Public()
  @ApiOperation({ summary: 'Upload evidence file for a vendor' })
  @ApiResponse({ status: 201, description: 'Evidence file uploaded successfully', type: EvidenceFileResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input or no file uploaded' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadEvidence(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('description') description?: string,
    @Body('category') category?: string,
    @Body('userId') userId?: string,
  ): Promise<{ success: boolean; message: string; evidenceFile: EvidenceFile }> {
    try {
      if (!file) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }

      const evidenceFile = await this.evidenceService.uploadEvidenceFile(
        file,
        vendorId,
        description,
        category,
        userId
      );

      return {
        success: true,
        message: 'Evidence file uploaded successfully',
        evidenceFile,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to upload evidence file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('vendors/:vendorId/evidence')
  @Public()
  @ApiOperation({ summary: 'Get evidence files for a vendor' })
  @ApiParam({ name: 'vendorId', description: 'Vendor UUID' })
  @ApiResponse({ status: 200, description: 'Returns vendor evidence files', type: [EvidenceFileResponseDto] })
  async getVendorEvidence(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
  ): Promise<{ success: boolean; evidenceFiles: EvidenceFile[]; count: number }> {
    try {
      const evidenceFiles = await this.evidenceService.getVendorEvidenceFiles(vendorId);

      return {
        success: true,
        evidenceFiles,
        count: evidenceFiles.length,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to get evidence files',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('vendors/:vendorId/evidence/:evidenceId')
  @Public()
  @ApiOperation({ summary: 'Get evidence file by ID' })
  @ApiParam({ name: 'vendorId', description: 'Vendor UUID' })
  @ApiParam({ name: 'evidenceId', description: 'Evidence file ID' })
  @ApiResponse({ status: 200, description: 'Evidence file retrieved successfully', type: EvidenceFileResponseDto })
  @ApiResponse({ status: 404, description: 'Evidence file not found' })
  async getEvidenceFileById(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Param('evidenceId', ParseUUIDPipe) evidenceId: string,
  ): Promise<EvidenceFile> {
    return this.evidenceService.getEvidenceFileById(evidenceId, vendorId);
  }

  @Put('vendors/:vendorId/evidence/:evidenceId')
  @Public()
  @ApiOperation({ summary: 'Update evidence file metadata' })
  @ApiParam({ name: 'vendorId', description: 'Vendor UUID' })
  @ApiParam({ name: 'evidenceId', description: 'Evidence file ID' })
  @ApiResponse({ status: 200, description: 'Evidence file updated successfully', type: EvidenceFileResponseDto })
  @ApiResponse({ status: 404, description: 'Evidence file not found' })
  async updateEvidenceFile(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Param('evidenceId', ParseUUIDPipe) evidenceId: string,
    @Body() updateDto: UpdateEvidenceFileDto,
  ): Promise<EvidenceFile> {
    return this.evidenceService.updateEvidenceFile(evidenceId, vendorId, updateDto);
  }

  @Delete('vendors/:vendorId/evidence/:evidenceId')
  @Public()
  @ApiOperation({ summary: 'Delete evidence file' })
  @ApiParam({ name: 'vendorId', description: 'Vendor UUID' })
  @ApiParam({ name: 'evidenceId', description: 'Evidence file ID' })
  @ApiResponse({ status: 200, description: 'Evidence file deleted successfully' })
  @ApiResponse({ status: 404, description: 'Evidence file not found' })
  async deleteEvidence(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Param('evidenceId', ParseUUIDPipe) evidenceId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.evidenceService.deleteEvidenceFile(evidenceId, vendorId);
      
      if (result) {
        return {
          success: true,
          message: 'Evidence file deleted successfully',
        };
      } else {
        throw new HttpException('Evidence file not found', HttpStatus.NOT_FOUND);
      }
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to delete evidence file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('vendors/:vendorId/evidence/:evidenceId/download')
  @Public()
  @ApiOperation({ summary: 'Generate download URL for evidence file' })
  @ApiParam({ name: 'vendorId', description: 'Vendor UUID' })
  @ApiParam({ name: 'evidenceId', description: 'Evidence file ID' })
  @ApiQuery({ name: 'expiresIn', description: 'URL expiration time in seconds', required: false })
  @ApiResponse({ status: 200, description: 'Download URL generated successfully' })
  @ApiResponse({ status: 404, description: 'Evidence file not found' })
  async generateDownloadUrl(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Param('evidenceId', ParseUUIDPipe) evidenceId: string,
    @Query('expiresIn') expiresIn?: string,
  ): Promise<{ downloadUrl: string }> {
    try {
      const expiration = expiresIn ? parseInt(expiresIn) : 3600;
      const downloadUrl = await this.evidenceService.generateDownloadUrl(evidenceId, vendorId, expiration);
      return { downloadUrl };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to generate download URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('vendors/:vendorId/evidence-content')
  @Public()
  @ApiOperation({ summary: 'Get evidence files content for AI enhancement' })
  @ApiParam({ name: 'vendorId', description: 'Vendor UUID' })
  @ApiResponse({ status: 200, description: 'Evidence content retrieved successfully' })
  async getVendorEvidenceContent(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
  ): Promise<{ content: string[] }> {
    try {
      const content = await this.evidenceService.getVendorEvidenceContent(vendorId);
      return { content };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to get evidence content',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 