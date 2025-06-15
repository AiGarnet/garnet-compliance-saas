import {
  Controller,
  Get,
  Query,
  Param,
  HttpStatus,
  HttpException,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('analytics')
@Controller('api/analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get comprehensive dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Returns dashboard statistics' })
  async getDashboardStats() {
    try {
      const stats = await this.analyticsService.getDashboardStats();
      return stats;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch dashboard statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('vendors')
  @ApiOperation({ summary: 'Get vendor analytics data' })
  @ApiResponse({ status: 200, description: 'Returns vendor analytics' })
  async getVendorAnalytics(@Query() query: AnalyticsQueryDto) {
    try {
      const analytics = await this.analyticsService.getVendorAnalytics(query);
      return analytics;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch vendor analytics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('vendors/:vendorId')
  @ApiOperation({ summary: 'Get analytics for a specific vendor' })
  @ApiResponse({ status: 200, description: 'Returns vendor-specific analytics' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async getVendorSpecificAnalytics(@Param('vendorId', ParseIntPipe) vendorId: number) {
    try {
      const analytics = await this.analyticsService.getVendorSpecificAnalytics(vendorId);
      return analytics;
    } catch (error: any) {
      if (error.message === 'Vendor not found') {
        throw new HttpException('Vendor not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        error.message || 'Failed to fetch vendor analytics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('time-based')
  @ApiOperation({ summary: 'Get time-based analytics' })
  @ApiResponse({ status: 200, description: 'Returns time-based analytics data' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d', '1y'] })
  async getTimeBasedAnalytics(@Query() query: AnalyticsQueryDto) {
    try {
      const analytics = await this.analyticsService.getTimeBasedAnalytics(query);
      return analytics;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch time-based analytics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('risk-distribution')
  @ApiOperation({ summary: 'Get risk distribution analytics' })
  @ApiResponse({ status: 200, description: 'Returns risk distribution data' })
  async getRiskDistribution() {
    try {
      const distribution = await this.analyticsService.getRiskDistribution();
      return distribution;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch risk distribution',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats/vendors')
  @ApiOperation({ summary: 'Get total vendor count' })
  @ApiResponse({ status: 200, description: 'Returns total vendor count' })
  async getTotalVendors() {
    try {
      const count = await this.analyticsService.getTotalVendors();
      return { totalVendors: count };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch vendor count',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats/questionnaires')
  @ApiOperation({ summary: 'Get total questionnaire count' })
  @ApiResponse({ status: 200, description: 'Returns total questionnaire count' })
  async getTotalQuestionnaires() {
    try {
      const count = await this.analyticsService.getTotalQuestionnaires();
      return { totalQuestionnaires: count };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch questionnaire count',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('vendors-by-status')
  @ApiOperation({ summary: 'Get vendor distribution by status' })
  @ApiResponse({ status: 200, description: 'Returns vendor status distribution' })
  async getVendorsByStatus() {
    try {
      const distribution = await this.analyticsService.getVendorsByStatus();
      return distribution;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch vendor status distribution',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Get recent activity feed' })
  @ApiResponse({ status: 200, description: 'Returns recent activity items' })
  async getRecentActivity() {
    try {
      const activity = await this.analyticsService.getRecentActivity();
      return activity;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch recent activity',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('compliance-overview')
  @ApiOperation({ summary: 'Get compliance overview statistics' })
  @ApiResponse({ status: 200, description: 'Returns compliance statistics' })
  async getComplianceOverview() {
    try {
      const overview = await this.analyticsService.getComplianceOverview();
      return overview;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch compliance overview',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 