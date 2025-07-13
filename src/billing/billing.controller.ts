import { 
  Controller, 
  Post, 
  Get, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Request, 
  Headers, 
  RawBodyRequest, 
  Req,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BillingService, CreateCheckoutSessionDto, CreatePortalSessionDto } from './billing.service';
import { PRICING_TIERS } from '../config/pricing';

@ApiTags('Billing')
@Controller('api/billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(private readonly billingService: BillingService) {}

  @Get('pricing')
  @ApiOperation({ summary: 'Get pricing tiers' })
  @ApiResponse({ status: 200, description: 'Pricing tiers retrieved successfully' })
  async getPricingTiers() {
    return {
      success: true,
      data: PRICING_TIERS,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  @ApiResponse({ status: 201, description: 'Checkout session created successfully' })
  async createCheckoutSession(@Request() req, @Body() body: {
    priceId: string;
    billingCycle: 'monthly' | 'annual';
    successUrl: string;
    cancelUrl: string;
  }) {
    const user = req.user;
    
    const dto: CreateCheckoutSessionDto = {
      priceId: body.priceId,
      userId: user.id,
      email: user.email,
      billingCycle: body.billingCycle,
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
    };

    const session = await this.billingService.createCheckoutSession(dto);
    
    return {
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('portal')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe customer portal session' })
  @ApiResponse({ status: 201, description: 'Portal session created successfully' })
  async createPortalSession(@Request() req, @Body() body: {
    returnUrl: string;
  }) {
    const user = req.user;
    
    // Get user's subscription to find customer ID
    const subscription = await this.billingService.getUserSubscription(user.id);
    if (!subscription) {
      throw new BadRequestException('No active subscription found');
    }

    const dto: CreatePortalSessionDto = {
      customerId: subscription.stripeCustomerId,
      returnUrl: body.returnUrl,
    };

    const session = await this.billingService.createPortalSession(dto);
    
    return {
      success: true,
      data: {
        url: session.url,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user subscription' })
  @ApiResponse({ status: 200, description: 'Subscription retrieved successfully' })
  async getUserSubscription(@Request() req) {
    const user = req.user;
    const subscription = await this.billingService.getUserSubscription(user.id);
    
    return {
      success: true,
      data: subscription,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('subscription')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel user subscription' })
  @ApiResponse({ status: 200, description: 'Subscription canceled successfully' })
  async cancelSubscription(@Request() req) {
    const user = req.user;
    await this.billingService.cancelSubscription(user.id);
    
    return {
      success: true,
      message: 'Subscription canceled successfully',
    };
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook handled successfully' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    const payload = req.rawBody;
    if (!payload) {
      throw new BadRequestException('Missing request body');
    }

    await this.billingService.handleWebhook(payload, signature);
    
    return {
      success: true,
      message: 'Webhook handled successfully',
    };
  }
} 