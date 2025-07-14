import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';

@ApiTags('Admin')
@Controller('api/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  // ============ DASHBOARD OVERVIEW ============
  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard overview' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getDashboardOverview() {
    return await this.adminService.getDashboardOverview();
  }

  // ============ USER MANAGEMENT ============
  @Get('users')
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'organization', required: false, type: String })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  async getAllUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('role') role?: string,
    @Query('organization') organization?: string,
    @Query('active') active?: boolean,
  ) {
    return await this.adminService.getAllUsers({
      page: parseInt(page.toString()),
      limit: parseInt(limit.toString()),
      role,
      organization,
      active,
    });
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details by ID' })
  async getUserById(@Param('id') id: string) {
    return await this.adminService.getUserById(id);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user (role, organization, active status)' })
  async updateUser(@Param('id') id: string, @Body() updateData: any) {
    return await this.adminService.updateUser(id, updateData);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Deactivate/Delete user' })
  async deactivateUser(@Param('id') id: string) {
    return await this.adminService.deactivateUser(id);
  }

  @Post('users/:id/activate')
  @ApiOperation({ summary: 'Activate user' })
  async activateUser(@Param('id') id: string) {
    return await this.adminService.activateUser(id);
  }

  // ============ VENDOR MANAGEMENT ============
  @Get('vendors')
  @ApiOperation({ summary: 'Get all vendors across all organizations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'organization', required: false, type: String })
  async getAllVendors(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
    @Query('organization') organization?: string,
  ) {
    return await this.adminService.getAllVendors({
      page: parseInt(page.toString()),
      limit: parseInt(limit.toString()),
      status,
      organization,
    });
  }

  @Get('vendors/:id')
  @ApiOperation({ summary: 'Get vendor details by ID (admin view)' })
  async getVendorById(@Param('id') id: string) {
    return await this.adminService.getVendorById(id);
  }

  @Put('vendors/:id')
  @ApiOperation({ summary: 'Update vendor (admin override)' })
  async updateVendor(@Param('id') id: string, @Body() updateData: any) {
    return await this.adminService.updateVendor(id, updateData);
  }

  @Delete('vendors/:id')
  @ApiOperation({ summary: 'Delete vendor (admin only)' })
  async deleteVendor(@Param('id') id: string) {
    return await this.adminService.deleteVendor(id);
  }

  // ============ ORGANIZATION MANAGEMENT ============
  @Get('organizations')
  @ApiOperation({ summary: 'Get all organizations' })
  async getAllOrganizations() {
    return await this.adminService.getAllOrganizations();
  }

  @Get('organizations/:id')
  @ApiOperation({ summary: 'Get organization details' })
  async getOrganizationById(@Param('id') id: string) {
    return await this.adminService.getOrganizationById(id);
  }

  @Put('organizations/:id')
  @ApiOperation({ summary: 'Update organization settings' })
  async updateOrganization(@Param('id') id: string, @Body() updateData: any) {
    return await this.adminService.updateOrganization(id, updateData);
  }

  @Post('organizations')
  @ApiOperation({ summary: 'Create new organization' })
  async createOrganization(@Body() organizationData: any) {
    return await this.adminService.createOrganization(organizationData);
  }

  // ============ ANALYTICS & MONITORING ============
  @Get('analytics/users')
  @ApiOperation({ summary: 'Get user analytics and statistics' })
  async getUserAnalytics() {
    return await this.adminService.getUserAnalytics();
  }

  @Get('analytics/vendors')
  @ApiOperation({ summary: 'Get vendor analytics and statistics' })
  async getVendorAnalytics() {
    return await this.adminService.getVendorAnalytics();
  }

  @Get('analytics/activities')
  @ApiOperation({ summary: 'Get system activity analytics' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getActivityAnalytics(@Query('days') days = 30) {
    return await this.adminService.getActivityAnalytics(parseInt(days.toString()));
  }

  @Get('analytics/waitlist')
  @ApiOperation({ summary: 'Get waitlist analytics' })
  async getWaitlistAnalytics() {
    return await this.adminService.getWaitlistAnalytics();
  }

  // ============ ACTIVITY MONITORING ============
  @Get('activities')
  @ApiOperation({ summary: 'Get system activities with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'user_id', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  async getActivities(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('user_id') userId?: string,
    @Query('type') type?: string,
  ) {
    return await this.adminService.getActivities({
      page: parseInt(page.toString()),
      limit: parseInt(limit.toString()),
      userId,
      type,
    });
  }

  @Get('activities/recent')
  @ApiOperation({ summary: 'Get recent activities (last 24 hours)' })
  async getRecentActivities() {
    return await this.adminService.getRecentActivities();
  }

  // ============ SYSTEM MANAGEMENT ============
  @Get('system/health')
  @ApiOperation({ summary: 'Get comprehensive system health' })
  async getSystemHealth() {
    return await this.adminService.getSystemHealth();
  }

  @Get('system/stats')
  @ApiOperation({ summary: 'Get system statistics' })
  async getSystemStats() {
    return await this.adminService.getSystemStats();
  }

  @Post('system/cleanup')
  @ApiOperation({ summary: 'Perform system cleanup tasks' })
  async performSystemCleanup(@Body() cleanupOptions: any) {
    return await this.adminService.performSystemCleanup(cleanupOptions);
  }

  // ============ TRUST PORTAL MANAGEMENT ============
  @Get('trust-portal/feedback')
  @ApiOperation({ summary: 'Get all trust portal feedback' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getTrustPortalFeedback(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    return await this.adminService.getTrustPortalFeedback({
      page: parseInt(page.toString()),
      limit: parseInt(limit.toString()),
      status,
    });
  }

  @Put('trust-portal/feedback/:id')
  @ApiOperation({ summary: 'Update trust portal feedback status' })
  async updateTrustPortalFeedback(@Param('id') id: string, @Body() updateData: any) {
    return await this.adminService.updateTrustPortalFeedback(id, updateData);
  }

  // ============ QUESTIONNAIRE MANAGEMENT ============
  @Get('questionnaires')
  @ApiOperation({ summary: 'Get all questionnaires across organizations' })
  async getAllQuestionnaires() {
    return await this.adminService.getAllQuestionnaires();
  }

  @Get('questionnaires/stats')
  @ApiOperation({ summary: 'Get questionnaire statistics' })
  async getQuestionnaireStats() {
    return await this.adminService.getQuestionnaireStats();
  }

  // ============ EVIDENCE FILES MANAGEMENT ============
  @Get('evidence')
  @ApiOperation({ summary: 'Get all evidence files across organizations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  async getAllEvidence(@Query('page') page = 1, @Query('limit') limit = 20) {
    return await this.adminService.getAllEvidence({
      page: parseInt(page.toString()),
      limit: parseInt(limit.toString()),
    });
  }

  @Get('evidence/stats')
  @ApiOperation({ summary: 'Get evidence file statistics' })
  async getEvidenceStats() {
    return await this.adminService.getEvidenceStats();
  }
} 