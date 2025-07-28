import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CouponsService } from './coupons.service';
import {
  CreateCouponDto,
  ValidateCouponDto,
  ApplyCouponDto,
  CouponValidationResponseDto,
  ApplyCouponResponseDto,
  CouponResponseDto
} from './dto/coupon.dto';

@ApiTags('Coupons')
@Controller('api/coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new coupon (Admin only)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Coupon created successfully', type: CouponResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Coupon code already exists' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async createCoupon(@Body() createCouponDto: CreateCouponDto, @Request() req): Promise<CouponResponseDto> {
    return this.couponsService.createCoupon(createCouponDto, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all coupons (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 50)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Coupons retrieved successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async getCoupons(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50'
  ): Promise<{ coupons: CouponResponseDto[]; total: number; page: number; limit: number }> {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const result = await this.couponsService.getCoupons(pageNum, limitNum);
    
    return {
      ...result,
      page: pageNum,
      limit: limitNum
    };
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate a coupon code' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Coupon validation result', type: CouponValidationResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request' })
  async validateCoupon(@Body() validateCouponDto: ValidateCouponDto): Promise<CouponValidationResponseDto> {
    return this.couponsService.validateCoupon(validateCouponDto);
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply a coupon to the current user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Coupon application result', type: ApplyCouponResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid coupon or already used' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async applyCoupon(@Body() applyCouponDto: ApplyCouponDto, @Request() req): Promise<ApplyCouponResponseDto> {
    return this.couponsService.applyCoupon(applyCouponDto, req.user.id);
  }

  @Get('my-coupons')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user\'s active coupons' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User active coupons retrieved' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getMyCoupons(@Request() req) {
    return this.couponsService.getUserActiveCoupons(req.user.id);
  }

  @Put(':id/deactivate')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a coupon (Admin only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Coupon deactivated successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async deactivateCoupon(@Param('id') id: string, @Request() req): Promise<{ message: string }> {
    await this.couponsService.deactivateCoupon(id, req.user.id);
    return { message: 'Coupon deactivated successfully' };
  }

  // Special endpoint for quick testing coupon creation
  @Post('create-test-coupon')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a backdoor testing coupon with full access (Admin only)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Test coupon created successfully', type: CouponResponseDto })
  async createTestCoupon(@Request() req): Promise<CouponResponseDto> {
    const testCouponDto: CreateCouponDto = {
      code: `TEST-${Date.now()}`, // Unique code with timestamp
      name: 'Full Access Testing Coupon',
      description: 'Backdoor coupon for testing - grants access to all features with no limits',
      permissions: {
        full_access: true,
        bypass_subscription: true,
        testing_access: true,
        unlimited_questionnaires: true,
        unlimited_vendors: true,
        unlimited_users: true,
        unlimited_storage: true,
        unlimited_frameworks: true,
        plan_override: 'enterprise'
      },
      usage_limit: 100, // Allow multiple uses for testing
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // Valid for 90 days
    };

    return this.couponsService.createCoupon(testCouponDto, req.user.id);
  }
} 