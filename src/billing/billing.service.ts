import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { DatabaseService } from '../database/database.service';
import { PRICING_TIERS, getPricingTierById } from '../config/pricing';

export interface CreateCheckoutSessionDto {
  priceId: string;
  userId: string;
  email: string;
  billingCycle: 'monthly' | 'annual';
  successUrl: string;
  cancelUrl: string;
}

export interface CreatePortalSessionDto {
  customerId: string;
  returnUrl: string;
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
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not configured - Stripe functionality will be disabled');
    } else {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2024-06-20',
      });
      this.logger.log('Stripe initialized successfully');
    }
  }

  async createCheckoutSession(dto: CreateCheckoutSessionDto): Promise<Stripe.Checkout.Session> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    try {
      // Find or create customer
      const customer = await this.findOrCreateCustomer(dto.userId, dto.email);

      const session = await this.stripe.checkout.sessions.create({
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
          billingCycle: dto.billingCycle,
        },
        subscription_data: {
          metadata: {
            userId: dto.userId,
            billingCycle: dto.billingCycle,
          },
        },
      });

      this.logger.log(`Created checkout session ${session.id} for user ${dto.userId}`);
      return session;
    } catch (error) {
      this.logger.error('Failed to create checkout session', error);
      throw new BadRequestException('Failed to create checkout session');
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

  async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
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

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    if (!userId) {
      this.logger.error('No userId in checkout session metadata');
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
    
    // Save subscription to database
    await this.saveSubscription(userId, session.customer as string, stripeSubscription);
    
    this.logger.log(`Subscription created for user ${userId}`);
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) return;

    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.userId;
    
    if (userId) {
      await this.updateSubscriptionStatus(subscriptionId, 'active');
      this.logger.log(`Invoice paid for user ${userId}`);
    }
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) return;

    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.userId;
    
    if (userId) {
      await this.updateSubscriptionStatus(subscriptionId, 'past_due');
      this.logger.log(`Payment failed for user ${userId}`);
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    await this.updateSubscriptionFromStripe(subscription);
    this.logger.log(`Subscription updated for user ${userId}`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    await this.updateSubscriptionStatus(subscription.id, 'canceled');
    this.logger.log(`Subscription deleted for user ${userId}`);
  }

  private async saveSubscription(
    userId: string,
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
      INSERT INTO subscriptions (
        user_id, stripe_customer_id, stripe_subscription_id, stripe_price_id,
        status, plan_id, billing_cycle, current_period_start, current_period_end,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (user_id, stripe_subscription_id) 
      DO UPDATE SET
        status = EXCLUDED.status,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        updated_at = EXCLUDED.updated_at
    `;

    const values = [
      userId,
      customerId,
      stripeSubscription.id,
      priceId,
      stripeSubscription.status,
      planId,
      billingCycle,
      new Date(stripeSubscription.current_period_start * 1000),
      new Date(stripeSubscription.current_period_end * 1000),
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
      new Date(stripeSubscription.current_period_start * 1000),
      new Date(stripeSubscription.current_period_end * 1000),
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
} 