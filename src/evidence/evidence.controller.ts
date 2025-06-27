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
  Res,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { EvidenceService } from './evidence.service';
import { UploadEvidenceDto } from './dto/evidence.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { FileUploadData } from './entities/evidence.entity';

@ApiTags('evidence')
@Controller('api')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post('vendors/:vendorId/evidence')
  @Public()
  @ApiOperation({ summary: 'Upload evidence file for a vendor' })
  @ApiResponse({ status: 201, description: 'Evidence file uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or no file uploaded' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadEvidence(
    @Param('vendorId') vendorIdParam: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadEvidenceDto: UploadEvidenceDto,
    @Req() req: Request,
  ) {
    try {
      if (!file) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }

      // Resolve vendor ID (UUID to numeric)
      const vendorId = await this.evidenceService.resolveVendorId(vendorIdParam);

      // Get user ID from JWT token (placeholder for now)
      const uploadedBy = uploadEvidenceDto.uploadedBy || 'system-user-id';

      // Parse metadata if provided
      let metadata: Record<string, any> | undefined;
      if (uploadEvidenceDto.metadata) {
        try {
          metadata = JSON.parse(uploadEvidenceDto.metadata);
        } catch (error) {
          throw new HttpException('Invalid metadata JSON', HttpStatus.BAD_REQUEST);
        }
      }

      const fileData: FileUploadData = {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      };

      const evidenceFile = await this.evidenceService.uploadEvidenceFile({
        vendorId,
        answerId: uploadEvidenceDto.answerId,
        file: fileData,
        uploadedBy,
        metadata,
      });

      return {
        success: true,
        message: 'Evidence file uploaded successfully',
        evidenceFile: {
          id: evidenceFile.id,
          filename: evidenceFile.originalFilename,
          fileSize: evidenceFile.fileSize,
          mimeType: evidenceFile.mimeType,
          uploadedAt: evidenceFile.uploadedAt,
          metadata: evidenceFile.metadata,
        },
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
  @ApiResponse({ status: 200, description: 'Returns vendor evidence files' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async getVendorEvidence(@Param('vendorId') vendorIdParam: string) {
    try {
      // Resolve vendor ID (UUID to numeric)
      const vendorId = await this.evidenceService.resolveVendorId(vendorIdParam);

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

  @Get('vendors/:vendorId/evidence/count')
  @Public()
  @ApiOperation({ summary: 'Get evidence file count for a vendor' })
  @ApiResponse({ status: 200, description: 'Returns evidence file count' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async getVendorEvidenceCount(@Param('vendorId') vendorIdParam: string) {
    try {
      // Resolve vendor ID (UUID to numeric)
      const vendorId = await this.evidenceService.resolveVendorId(vendorIdParam);

      const count = await this.evidenceService.getVendorEvidenceCount(vendorId);

      return {
        success: true,
        count,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to get evidence count',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('vendors/:vendorId/evidence/:evidenceId/download')
  @Public()
  @ApiOperation({ summary: 'Download evidence file' })
  @ApiResponse({ status: 200, description: 'Evidence file download' })
  @ApiResponse({ status: 404, description: 'Evidence file not found' })
  async downloadEvidence(
    @Param('vendorId') vendorIdParam: string,
    @Param('evidenceId') evidenceId: string,
    @Res() res: Response,
  ) {
    try {
      // Resolve vendor ID (UUID to numeric)
      const vendorId = await this.evidenceService.resolveVendorId(vendorIdParam);

      const { file, content } = await this.evidenceService.getEvidenceFileContent(
        evidenceId,
        vendorId,
      );

      // Set appropriate headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalFilename}"`);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Length', file.fileSize.toString());

      res.send(content);
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to download evidence file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('vendors/:vendorId/evidence/:evidenceId')
  @ApiOperation({ summary: 'Delete evidence file' })
  @ApiResponse({ status: 200, description: 'Evidence file deleted successfully' })
  @ApiResponse({ status: 404, description: 'Evidence file not found' })
  async deleteEvidence(
    @Param('vendorId') vendorIdParam: string,
    @Param('evidenceId') evidenceId: string,
  ) {
    try {
      // Resolve vendor ID (UUID to numeric)
      const vendorId = await this.evidenceService.resolveVendorId(vendorIdParam);

      const deleted = await this.evidenceService.deleteEvidenceFile(evidenceId, vendorId);

      if (!deleted) {
        throw new HttpException('Evidence file not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        message: 'Evidence file deleted successfully',
      };
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

  @Get('answers/:answerId/evidence')
  @ApiOperation({ summary: 'Get evidence files for a specific answer' })
  @ApiResponse({ status: 200, description: 'Returns answer evidence files' })
  async getAnswerEvidence(@Param('answerId') answerId: string) {
    try {
      const evidenceFiles = await this.evidenceService.getAnswerEvidenceFiles(answerId);

      return {
        success: true,
        evidenceFiles,
        count: evidenceFiles.length,
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to get answer evidence files',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 