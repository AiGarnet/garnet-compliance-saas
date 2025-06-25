import { Controller, Post, Get, Body, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { JoinWaitlistDto } from './dto/waitlist.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Waitlist')
@Controller('api/waitlist')
export class WaitlistController {
  private readonly logger = new Logger(WaitlistController.name);

  constructor(private readonly waitlistService: WaitlistService) {}

  @Public()
  @Post('join')
  @ApiOperation({ summary: 'Join the waitlist (simple form - no password)' })
  @ApiResponse({ status: 201, description: 'Successfully joined waitlist' })
  @ApiResponse({ status: 400, description: 'Missing required fields or invalid email' })
  @ApiResponse({ status: 409, description: 'Email already registered in waitlist' })
  async joinWaitlist(@Body() joinWaitlistDto: JoinWaitlistDto) {
    try {
      this.logger.log(`Received waitlist request at: ${new Date().toISOString()}`);
      this.logger.debug('Request body:', joinWaitlistDto);

      // Validate required fields (email and full_name are required)
      if (!joinWaitlistDto.email || !joinWaitlistDto.full_name) {
        this.logger.error('Missing required fields');
        throw new HttpException(
          {
            success: false,
            error: 'Missing required fields: email and full_name are required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(joinWaitlistDto.email)) {
        this.logger.error(`Invalid email format: ${joinWaitlistDto.email}`);
        throw new HttpException(
          { success: false, error: 'Invalid email format' },
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log('Adding to waitlist table...');

      // Add to waitlist using the service
      const waitlistEntry = await this.waitlistService.addToWaitlist(joinWaitlistDto);

      this.logger.log('Successfully added to waitlist:', waitlistEntry);

      // Return success response matching original format
      return {
        success: true,
        message: 'Successfully joined the waitlist!',
        data: waitlistEntry,
      };
    } catch (error: any) {
      this.logger.error('Error in join-waitlist endpoint:', error);

      // Check for duplicate email
      if (error.message === 'Email already exists in waitlist') {
        throw new HttpException(
          {
            success: false,
            error: 'Email already registered in waitlist',
          },
          HttpStatus.CONFLICT,
        );
      }

      // General error
      throw new HttpException(
        {
          success: false,
          error: 'Internal server error',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Get waitlist statistics' })
  @ApiResponse({ status: 200, description: 'Waitlist statistics retrieved' })
  async getWaitlistStats() {
    try {
      const stats = await this.waitlistService.getWaitlistStats();
      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      this.logger.error('Error fetching waitlist stats:', error);
      throw new HttpException(
        { success: false, error: 'Internal server error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Public()
  @Get('users')
  @ApiOperation({ summary: 'Get all waitlist entries' })
  @ApiResponse({ status: 200, description: 'Waitlist users retrieved' })
  async getWaitlistUsers() {
    try {
      const users = await this.waitlistService.getAllWaitlistEntries();
      return { 
        success: true,
        data: { users }
      };
    } catch (error: any) {
      this.logger.error('Error fetching waitlist users:', error);
      throw new HttpException(
        { success: false, error: 'Internal server error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 