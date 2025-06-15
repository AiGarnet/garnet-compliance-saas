import { Controller, Post, Get, Body, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { JoinWaitlistDto } from './dto/waitlist.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Waitlist')
@Controller()
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Public()
  @Post('join-waitlist')
  @ApiOperation({ summary: 'Join the waitlist (simple form - no password)' })
  @ApiResponse({ status: 201, description: 'Successfully joined waitlist' })
  @ApiResponse({ status: 400, description: 'Missing required fields or invalid email' })
  @ApiResponse({ status: 409, description: 'Email already registered in waitlist' })
  async joinWaitlist(@Body() joinWaitlistDto: JoinWaitlistDto) {
    try {
      console.log('Received waitlist request at:', new Date().toISOString());
      console.log('Request body:', joinWaitlistDto);

      // Validate required fields (email and full_name are required)
      if (!joinWaitlistDto.email || !joinWaitlistDto.full_name) {
        console.error('Missing required fields');
        throw new HttpException(
          {
            error: 'Missing required fields: email and full_name are required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(joinWaitlistDto.email)) {
        console.error('Invalid email format:', joinWaitlistDto.email);
        throw new HttpException(
          { error: 'Invalid email format' },
          HttpStatus.BAD_REQUEST,
        );
      }

      console.log('Adding to waitlist table...');

      // Add to waitlist using the service
      const waitlistEntry = await this.waitlistService.addToWaitlist(joinWaitlistDto);

      console.log('Successfully added to waitlist:', waitlistEntry);

      // Return success response matching original format
      return {
        success: true,
        message: 'Successfully joined the waitlist!',
        data: waitlistEntry,
      };
    } catch (error: any) {
      console.error('Error in join-waitlist endpoint:', error);

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
  @Get('api/waitlist/stats')
  @ApiOperation({ summary: 'Get waitlist statistics' })
  @ApiResponse({ status: 200, description: 'Waitlist statistics retrieved' })
  async getWaitlistStats() {
    try {
      const stats = await this.waitlistService.getWaitlistStats();
      return stats;
    } catch (error: any) {
      console.error('Error fetching waitlist stats:', error);
      throw new HttpException(
        { error: 'Internal server error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Public()
  @Get('api/waitlist/users')
  @ApiOperation({ summary: 'Get all waitlist entries' })
  @ApiResponse({ status: 200, description: 'Waitlist users retrieved' })
  async getWaitlistUsers() {
    try {
      const users = await this.waitlistService.getAllWaitlistEntries();
      return { users };
    } catch (error: any) {
      console.error('Error fetching waitlist users:', error);
      throw new HttpException(
        { error: 'Internal server error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 