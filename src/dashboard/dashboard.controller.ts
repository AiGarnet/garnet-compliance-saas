import { Controller, Get, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService, PendingTask, FeedbackNavigation } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('api/dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('pending-tasks')
  @ApiOperation({ summary: 'Get pending tasks for user\'s organization' })
  @ApiResponse({ status: 200, description: 'Returns pending tasks' })
  async getPendingTasks(@Request() req): Promise<{
    success: boolean;
    data: PendingTask[];
    meta: {
      timestamp: string;
      count: number;
      userId: string;
    };
  }> {
    const tasks = await this.dashboardService.getPendingTasks(req.user.id);
    
    return {
      success: true,
      data: tasks,
      meta: {
        timestamp: new Date().toISOString(),
        count: tasks.length,
        userId: req.user.id
      }
    };
  }

  @Get('feedback/:id/navigation')
  @ApiOperation({ summary: 'Get smart navigation info for feedback' })
  @ApiResponse({ status: 200, description: 'Returns navigation info for feedback' })
  async getFeedbackNavigation(
    @Param('id', ParseIntPipe) feedbackId: number
  ): Promise<{
    success: boolean;
    data: FeedbackNavigation | null;
    meta: {
      timestamp: string;
      feedbackId: number;
    };
  }> {
    const navigation = await this.dashboardService.getFeedbackNavigation(feedbackId);
    
    return {
      success: true,
      data: navigation,
      meta: {
        timestamp: new Date().toISOString(),
        feedbackId
      }
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Returns dashboard statistics' })
  async getDashboardStats(@Request() req): Promise<{
    success: boolean;
    data: {
      totalVendors: number;
      totalChecklists: number;
      completedChecklists: number;
      pendingTasks: number;
      totalFeedback: number;
      unreadFeedback: number;
    };
    meta: {
      timestamp: string;
      userId: string;
    };
  }> {
    const stats = await this.dashboardService.getDashboardStats(req.user.id);
    
    return {
      success: true,
      data: stats,
      meta: {
        timestamp: new Date().toISOString(),
        userId: req.user.id
      }
    };
  }
} 