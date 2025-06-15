import { Controller, Post, Get, Body, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto, WaitlistSignupDto, AuthResponseDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'User signup with authentication' })
  @ApiResponse({ status: 201, description: 'User created successfully', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async signup(@Body() signupDto: SignupDto) {
    return await this.authService.signup(signupDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    return {
      user: {
        id: req.user.id,
        email: req.user.email,
        full_name: req.user.full_name,
        role: req.user.role,
        organization: req.user.organization,
      },
    };
  }
}

@ApiTags('Authentication - Waitlist Signup')
@Controller()
export class AuthWaitlistController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('api/waitlist/signup')
  @ApiOperation({ summary: 'Join waitlist with password (creates authenticated user)' })
  @ApiResponse({ status: 201, description: 'Successfully signed up with authentication' })
  @ApiResponse({ status: 400, description: 'Missing required fields or validation error' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async waitlistSignup(@Body() waitlistDto: WaitlistSignupDto) {
    try {
      // Validate required fields
      if (!waitlistDto.email || !waitlistDto.password || !waitlistDto.full_name || !waitlistDto.role) {
        throw new HttpException(
          { error: 'Missing required fields: email, password, full_name, and role are required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(waitlistDto.email)) {
        throw new HttpException({ error: 'Invalid email format' }, HttpStatus.BAD_REQUEST);
      }

      // Validate password strength
      if (waitlistDto.password.length < 8) {
        throw new HttpException(
          { error: 'Password must be at least 8 characters long' },
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.authService.waitlistSignup(waitlistDto);
    } catch (error: any) {
      console.error('Waitlist signup error:', error);
      if (error.message === 'Email already registered') {
        throw new HttpException({ error: 'Email already registered' }, HttpStatus.CONFLICT);
      }
      if (error.status) {
        throw error; // Re-throw HTTP exceptions
      }
      throw new HttpException({ error: 'Internal server error' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Public()
  @Get('api/waitlist/stats')
  @ApiOperation({ summary: 'Get waitlist statistics (from users table)' })
  @ApiResponse({ status: 200, description: 'Waitlist statistics retrieved' })
  async getWaitlistStats() {
    try {
      return await this.authService.getWaitlistStats();
    } catch (error: any) {
      console.error('Error fetching waitlist stats:', error);
      throw new HttpException({ error: 'Internal server error' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Public()
  @Get('api/waitlist/users')
  @ApiOperation({ summary: 'Get all waitlist entries (from users table)' })
  @ApiResponse({ status: 200, description: 'Waitlist users retrieved' })
  async getWaitlistUsers() {
    try {
      const users = await this.authService.getAllWaitlistUsers();
      return { users };
    } catch (error: any) {
      console.error('Error fetching waitlist users:', error);
      throw new HttpException({ error: 'Internal server error' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 