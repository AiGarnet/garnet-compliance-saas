import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { DatabaseService } from '../database/database.service';
import { PRICING_TIERS, getPricingTierById } from '../config/pricing';
import { StripeCouponsService } from './stripe-coupons.service';

export interface CreateCheckoutSessionDto {
  priceId: string;
  userId: string;
  email: string;
  billingCycle: 'monthly' | 'annual';
  successUrl: string;
  cancelUrl: string;
  coupon?: string; // Optional coupon code
}

export interface CreatePortalSessionDto {
  customerId: string;
  returnUrl: string;
}

export interface OrganizationSubscription {
  id: string;
  organizationId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete';
  planId: string;
  billingCycle: 'monthly' | 'annual';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete';
  planId: string;
  billingCycle: 'monthly' | 'annual';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly stripeCouponsService: StripeCouponsService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not configured - Stripe functionality will be disabled');
    } else {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-06-30.basil',
      });
      this.logger.log('Stripe initialized successfully');
    }
  }

  async createCheckoutSession(dto: CreateCheckoutSessionDto): Promise<Stripe.Checkout.Session> {
    if (!this.stripe) {
      this.logger.error('Stripe is not configured - missing STRIPE_SECRET_KEY');
      throw new BadRequestException('Stripe is not configured');
    }

    this.logger.log(`Creating checkout session for user ${dto.userId} with price ${dto.priceId}`);

    try {
      // Validate price ID format
      if (!dto.priceId || !dto.priceId.startsWith('price_')) {
        this.logger.error(`Invalid price ID format: ${dto.priceId}`);
        throw new BadRequestException(`Invalid price ID: ${dto.priceId}`);
      }

      // Get user's organization info
      const userQuery = `
        SELECT u.id, u.email, u.organization_id, o.name as organization_name
        FROM users u 
        LEFT JOIN organizations o ON u.organization_id = o.id
        WHERE u.id = $1
      `;
      const userResult = await this.databaseService.query(userQuery, [dto.userId]);
      
      if (userResult.rows.length === 0) {
        throw new BadRequestException('User not found');
      }

      const user = userResult.rows[0];
      const organizationId = user.organization_id;

      if (!organizationId) {
        throw new BadRequestException('User must belong to an organization to purchase a subscription');
      }

      // Check if organization already has an active subscription
      const existingSubscription = await this.getOrganizationSubscription(organizationId);
      if (existingSubscription && existingSubscription.status === 'active') {
        throw new BadRequestException('Organization already has an active subscription');
      }

      // Find or create customer for the organization
      const customer = await this.findOrCreateOrganizationCustomer(organizationId, dto.email, user.organization_name);
      this.logger.log(`Using Stripe customer: ${customer.id} for organization: ${organizationId}`);

      // Prepare checkout session configuration
      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: dto.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: dto.successUrl,
        cancel_url: dto.cancelUrl,
        metadata: {
          userId: dto.userId,
          organizationId: organizationId,
          billingCycle: dto.billingCycle,
        },
        subscription_data: {
          metadata: {
            userId: dto.userId,
            organizationId: organizationId,
            billingCycle: dto.billingCycle,
          },
        },
      };

      // Add coupon if provided
      if (dto.coupon) {
        this.logger.log(`Validating Stripe coupon ${dto.coupon}`);
        
        // Validate the coupon and get the actual Stripe coupon ID
        const stripeCouponId = await this.stripeCouponsService.getStripeCouponId(dto.coupon);
        
        if (!stripeCouponId) {
          this.logger.warn(`Invalid or expired Stripe coupon: ${dto.coupon}`);
          throw new BadRequestException(`Invalid or expired coupon code: ${dto.coupon}`);
        }
        
        this.logger.log(`Applying Stripe coupon ${stripeCouponId} to checkout session`);
        sessionConfig.discounts = [{
          coupon: stripeCouponId, // Use the actual Stripe coupon ID
        }];
      }

      const session = await this.stripe.checkout.sessions.create(sessionConfig);

      this.logger.log(`Created checkout session ${session.id} for organization ${organizationId}`);
      return session;
    } catch (error) {
      this.logger.error('Failed to create checkout session', {
        error: error.message,
        stack: error.stack,
        userId: dto.userId,
        priceId: dto.priceId,
        billingCycle: dto.billingCycle
      });
      
      // Re-throw with more specific error message
      if (error.type === 'StripeInvalidRequestError') {
        throw new BadRequestException(`Stripe error: ${error.message}`);
      }
      
      throw new BadRequestException(`Failed to create checkout session: ${error.message}`);
    }
  }

  async createPortalSession(dto: CreatePortalSessionDto): Promise<Stripe.BillingPortal.Session> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: dto.customerId,
        return_url: dto.returnUrl,
      });

      this.logger.log(`Created portal session for customer ${dto.customerId}`);
      return session;
    } catch (error) {
      this.logger.error('Failed to create portal session', error);
      throw new BadRequestException('Failed to create portal session');
    }
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook secret not configured');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      
      this.logger.log(`Received webhook event: ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        default:
          this.logger.log(`Unhandled webhook event: ${event.type}`);
      }
    } catch (error) {
      this.logger.error('Failed to handle webhook', error);
      throw new BadRequestException('Failed to handle webhook');
    }
  }

  // Organization subscription methods
  async getOrganizationSubscription(organizationId: string): Promise<OrganizationSubscription | null> {
    try {
      const query = `
        SELECT * FROM organization_subscriptions 
        WHERE organization_id = $1 AND status IN ('active', 'past_due')
        ORDER BY created_at DESC LIMIT 1
      `;
      const result = await this.databaseService.query(query, [organizationId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapDbRowToOrganizationSubscription(result.rows[0]);
    } catch (error) {
      this.logger.error('Failed to get organization subscription', error);
      throw error;
    }
  }

  async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      // First, try to get user's organization subscription
      const userQuery = `
        SELECT u.organization_id, o.name as organization_name
        FROM users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        WHERE u.id = $1
      `;
      const userResult = await this.databaseService.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0 || !userResult.rows[0].organization_id) {
        // Fallback to legacy user-level subscription for backwards compatibility
        const query = `
          SELECT * FROM subscriptions 
          WHERE user_id = $1 AND status IN ('active', 'past_due')
          ORDER BY created_at DESC LIMIT 1
        `;
        const result = await this.databaseService.query(query, [userId]);
        
        if (result.rows.length === 0) {
          return null;
        }

        return this.mapDbRowToSubscription(result.rows[0]);
      }

      // Get organization subscription
      const organizationId = userResult.rows[0].organization_id;
      const orgSubscription = await this.getOrganizationSubscription(organizationId);
      
      if (!orgSubscription) {
        return null;
      }

      // Convert organization subscription to user subscription format for compatibility
      return {
        id: orgSubscription.id,
        userId: userId,
        stripeCustomerId: orgSubscription.stripeCustomerId,
        stripeSubscriptionId: orgSubscription.stripeSubscriptionId,
        stripePriceId: orgSubscription.stripePriceId,
        status: orgSubscription.status,
        planId: orgSubscription.planId,
        billingCycle: orgSubscription.billingCycle,
        currentPeriodStart: orgSubscription.currentPeriodStart,
        currentPeriodEnd: orgSubscription.currentPeriodEnd,
        createdAt: orgSubscription.createdAt,
        updatedAt: orgSubscription.updatedAt,
      };
    } catch (error) {
      this.logger.error('Failed to get user subscription', error);
      throw error;
    }
  }

  async cancelSubscription(userId: string): Promise<void> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    try {
      await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      
      // Update subscription status in database
      await this.updateSubscriptionStatus(subscription.id, 'canceled');
      
      this.logger.log(`Canceled subscription ${subscription.id} for user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to cancel subscription', error);
      throw new BadRequestException('Failed to cancel subscription');
    }
  }

  private async findOrCreateCustomer(userId: string, email: string): Promise<Stripe.Customer> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    // Check if customer already exists in our database
    const query = `
      SELECT stripe_customer_id FROM subscriptions 
      WHERE user_id = $1 AND stripe_customer_id IS NOT NULL
      LIMIT 1
    `;
    const result = await this.databaseService.query(query, [userId]);
    
    if (result.rows.length > 0) {
      const customerId = result.rows[0].stripe_customer_id;
      try {
        return await this.stripe.customers.retrieve(customerId) as Stripe.Customer;
      } catch (error) {
        this.logger.warn(`Customer ${customerId} not found in Stripe, creating new one`);
      }
    }

    // Create new customer
    const customer = await this.stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });

    this.logger.log(`Created Stripe customer ${customer.id} for user ${userId}`);
    return customer;
  }

  private async findOrCreateOrganizationCustomer(organizationId: string, email: string, organizationName: string): Promise<Stripe.Customer> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    // Check if customer already exists in our database
    const query = `
      SELECT stripe_customer_id FROM organization_subscriptions 
      WHERE organization_id = $1 AND stripe_customer_id IS NOT NULL
      LIMIT 1
    `;
    const result = await this.databaseService.query(query, [organizationId]);
    
    if (result.rows.length > 0) {
      const customerId = result.rows[0].stripe_customer_id;
      try {
        return await this.stripe.customers.retrieve(customerId) as Stripe.Customer;
      } catch (error) {
        this.logger.warn(`Customer ${customerId} not found in Stripe, creating new one`);
      }
    }

    // Create new customer
    const customer = await this.stripe.customers.create({
      email,
      name: organizationName,
      metadata: {
        organizationId,
      },
    });

    this.logger.log(`Created Stripe customer ${customer.id} for organization ${organizationId}`);
    return customer;
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    if (!userId) {
      this.logger.error('No userId in checkout session metadata');
      return;
    }

    const organizationId = session.metadata?.organizationId;
    if (!organizationId) {
      this.logger.error('No organizationId in checkout session metadata');
      return;
    }

    const subscription = session.subscription as string;
    if (!subscription) {
      this.logger.error('No subscription in checkout session');
      return;
    }

    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    // Get subscription details from Stripe
    const stripeSubscription = await this.stripe.subscriptions.retrieve(subscription);
    
    // Check if a discount was applied and track coupon usage
    if (stripeSubscription.discounts && stripeSubscription.discounts.length > 0) {
      // Get the first discount (there should only be one for our use case)
      const discount = stripeSubscription.discounts[0];
      
      // Check if it's a Discount object (not just a string ID)
      if (typeof discount === 'object' && discount.coupon) {
        const stripeCouponId = discount.coupon.id;
        this.logger.log(`Checkout completed with Stripe coupon: ${stripeCouponId}`);
        
        // Find the corresponding coupon code in our database and increment usage
        try {
          const couponQuery = `
            SELECT code FROM stripe_coupons 
            WHERE stripe_coupon_id = $1 AND is_active = true
          `;
          const couponResult = await this.databaseService.query(couponQuery, [stripeCouponId]);
          
          if (couponResult.rows.length > 0) {
            const couponCode = couponResult.rows[0].code;
            await this.stripeCouponsService.incrementCouponUsage(couponCode);
            this.logger.log(`Incremented usage for Stripe coupon: ${couponCode}`);
          }
        } catch (error) {
          this.logger.error('Failed to track coupon usage', error);
          // Don't fail the subscription creation if coupon tracking fails
        }
      }
    }
    
    // Save subscription to database
    await this.saveSubscription(userId, organizationId, session.customer as string, stripeSubscription);
    
    this.logger.log(`Subscription created for user ${userId}`);
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = (invoice as any).subscription as string;
    if (!subscriptionId) {
      this.logger.warn('Invoice paid but no subscription found');
      return;
    }

    try {
      // Update organization subscription status
      const query = `
        UPDATE organization_subscriptions 
        SET status = 'active', updated_at = CURRENT_TIMESTAMP
        WHERE stripe_subscription_id = $1
      `;
      await this.databaseService.query(query, [subscriptionId]);
      
      // Also update organization record
      const orgQuery = `
        UPDATE organizations 
        SET current_subscription_status = 'active'
        WHERE id IN (
          SELECT organization_id FROM organization_subscriptions 
          WHERE stripe_subscription_id = $1
        )
      `;
      await this.databaseService.query(orgQuery, [subscriptionId]);
      
      this.logger.log(`Invoice paid for subscription ${subscriptionId}`);
    } catch (error) {
      this.logger.error('Failed to handle invoice paid', error);
    }
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = (invoice as any).subscription as string;
    if (!subscriptionId) {
      this.logger.warn('Invoice payment failed but no subscription found');
      return;
    }

    try {
      // Update organization subscription status
      const query = `
        UPDATE organization_subscriptions 
        SET status = 'past_due', updated_at = CURRENT_TIMESTAMP
        WHERE stripe_subscription_id = $1
      `;
      await this.databaseService.query(query, [subscriptionId]);
      
      // Also update organization record
      const orgQuery = `
        UPDATE organizations 
        SET 
          current_subscription_status = 'past_due'
        WHERE id IN (
          SELECT organization_id FROM organization_subscriptions 
          WHERE stripe_subscription_id = $1
        )
      `;
      await this.databaseService.query(orgQuery, [subscriptionId]);
      
      this.logger.log(`Invoice payment failed for subscription ${subscriptionId}`);
    } catch (error) {
      this.logger.error('Failed to handle invoice payment failed', error);
    }
  }

  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
    try {
      const priceId = stripeSubscription.items.data[0]?.price.id;
      if (!priceId) {
        this.logger.error('No price ID found in subscription update');
        return;
      }

      const { planId, billingCycle } = this.getPlanFromPriceId(priceId);

      // Update organization subscription
      const query = `
        UPDATE organization_subscriptions 
        SET 
          stripe_price_id = $1,
          status = $2,
          plan_id = $3,
          billing_cycle = $4,
          current_period_start = $5,
          current_period_end = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE stripe_subscription_id = $7
      `;

      const values = [
        priceId,
        stripeSubscription.status,
        planId,
        billingCycle,
        new Date((stripeSubscription as any).current_period_start * 1000),
        new Date((stripeSubscription as any).current_period_end * 1000),
        stripeSubscription.id,
      ];

      await this.databaseService.query(query, values);
      
      // Also update organization record
      const orgQuery = `
        UPDATE organizations 
        SET 
          current_subscription_plan = $1,
          current_subscription_status = $2,
          subscription_expires_at = $3
        WHERE id IN (
          SELECT organization_id FROM organization_subscriptions 
          WHERE stripe_subscription_id = $4
        )
      `;
      
      const orgValues = [
        planId,
        stripeSubscription.status,
        new Date((stripeSubscription as any).current_period_end * 1000),
        stripeSubscription.id,
      ];
      
      await this.databaseService.query(orgQuery, orgValues);

      this.logger.log(`Subscription updated: ${stripeSubscription.id}`);
    } catch (error) {
      this.logger.error('Failed to handle subscription updated', error);
    }
  }

  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
    try {
      // Update organization subscription status
      const query = `
        UPDATE organization_subscriptions 
        SET status = 'canceled', updated_at = CURRENT_TIMESTAMP
        WHERE stripe_subscription_id = $1
      `;
      await this.databaseService.query(query, [stripeSubscription.id]);
      
      // Also update organization record
      const orgQuery = `
        UPDATE organizations 
        SET 
          current_subscription_status = 'canceled',
          current_subscription_plan = 'starter'
        WHERE id IN (
          SELECT organization_id FROM organization_subscriptions 
          WHERE stripe_subscription_id = $1
        )
      `;
      await this.databaseService.query(orgQuery, [stripeSubscription.id]);

      this.logger.log(`Subscription deleted: ${stripeSubscription.id}`);
    } catch (error) {
      this.logger.error('Failed to handle subscription deleted', error);
    }
  }

  private async saveSubscription(
    userId: string,
    organizationId: string,
    customerId: string,
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const priceId = stripeSubscription.items.data[0]?.price.id;
    if (!priceId) {
      throw new BadRequestException('No price ID found in subscription');
    }

    // Determine plan ID and billing cycle from price ID
    const { planId, billingCycle } = this.getPlanFromPriceId(priceId);

    const query = `
      INSERT INTO organization_subscriptions (
        organization_id, stripe_customer_id, stripe_subscription_id, stripe_price_id,
        status, plan_id, billing_cycle, current_period_start, current_period_end,
        created_by_user_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (organization_id, stripe_subscription_id) 
      DO UPDATE SET
        status = EXCLUDED.status,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        updated_at = EXCLUDED.updated_at
    `;

    const values = [
      organizationId,
      customerId,
      stripeSubscription.id,
      priceId,
      stripeSubscription.status,
      planId,
      billingCycle,
      new Date((stripeSubscription as any).current_period_start * 1000),
      new Date((stripeSubscription as any).current_period_end * 1000),
      userId, // created_by_user_id
      new Date(),
      new Date(),
    ];

    await this.databaseService.query(query, values);
  }

  private async updateSubscriptionFromStripe(stripeSubscription: Stripe.Subscription): Promise<void> {
    const query = `
      UPDATE subscriptions SET
        status = $1,
        current_period_start = $2,
        current_period_end = $3,
        updated_at = $4
      WHERE stripe_subscription_id = $5
    `;

    const values = [
      stripeSubscription.status,
      new Date((stripeSubscription as any).current_period_start * 1000),
      new Date((stripeSubscription as any).current_period_end * 1000),
      new Date(),
      stripeSubscription.id,
    ];

    await this.databaseService.query(query, values);
  }

  private async updateSubscriptionStatus(subscriptionId: string, status: string): Promise<void> {
    const query = `
      UPDATE subscriptions SET
        status = $1,
        updated_at = $2
      WHERE stripe_subscription_id = $3
    `;

    await this.databaseService.query(query, [status, new Date(), subscriptionId]);
  }

  private getPlanFromPriceId(priceId: string): { planId: string; billingCycle: 'monthly' | 'annual' } {
    for (const tier of PRICING_TIERS) {
      if (tier.stripePriceIds?.monthly === priceId) {
        return { planId: tier.id, billingCycle: 'monthly' };
      }
      if (tier.stripePriceIds?.annual === priceId) {
        return { planId: tier.id, billingCycle: 'annual' };
      }
    }
    
    throw new BadRequestException(`Unknown price ID: ${priceId}`);
  }

  private mapDbRowToOrganizationSubscription(row: any): OrganizationSubscription {
    return {
      id: row.id,
      organizationId: row.organization_id,
      stripeCustomerId: row.stripe_customer_id,
      stripeSubscriptionId: row.stripe_subscription_id,
      stripePriceId: row.stripe_price_id,
      status: row.status,
      planId: row.plan_id,
      billingCycle: row.billing_cycle,
      currentPeriodStart: row.current_period_start,
      currentPeriodEnd: row.current_period_end,
      createdByUserId: row.created_by_user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapDbRowToSubscription(row: any): Subscription {
    return {
      id: row.id,
      userId: row.user_id,
      stripeCustomerId: row.stripe_customer_id,
      stripeSubscriptionId: row.stripe_subscription_id,
      stripePriceId: row.stripe_price_id,
      status: row.status,
      planId: row.plan_id,
      billingCycle: row.billing_cycle,
      currentPeriodStart: row.current_period_start,
      currentPeriodEnd: row.current_period_end,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // Helper method to check if user has access to a feature based on organization subscription
  async checkOrganizationFeatureAccess(userId: string, feature: string): Promise<boolean> {
    try {
      const userQuery = `
        SELECT u.organization_id FROM users u WHERE u.id = $1
      `;
      const userResult = await this.databaseService.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0 || !userResult.rows[0].organization_id) {
        return false; // User not in organization
      }

      const organizationId = userResult.rows[0].organization_id;
      const subscription = await this.getOrganizationSubscription(organizationId);
      
      if (!subscription || subscription.status !== 'active') {
        return feature === 'basic_access'; // Only basic access without subscription
      }

      const tier = getPricingTierById(subscription.planId);
      if (!tier) {
        return false;
      }

      // Check if the plan includes the requested feature
      return tier.features.some(f => f.toLowerCase().includes(feature.toLowerCase()));
    } catch (error) {
      this.logger.error('Failed to check organization feature access', error);
      return false;
    }
  }
} 