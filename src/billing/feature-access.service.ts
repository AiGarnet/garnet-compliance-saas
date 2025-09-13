import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { BillingService } from './billing.service';
import { getPricingTierById } from '../config/pricing';
import { DatabaseService } from '../database/database.service';
import { CouponsService } from '../coupons/coupons.service';

export interface FeatureAccess {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: string;
  trialExpired?: boolean;
}

@Injectable()
export class FeatureAccessService {
  private readonly logger = new Logger(FeatureAccessService.name);

  constructor(
    private readonly billingService: BillingService,
    private readonly databaseService: DatabaseService,
    @Inject(forwardRef(() => CouponsService))
    private readonly couponsService: CouponsService,
  ) {}

  async checkFeatureAccess(
    userId: string,
    feature: string,
    currentUsage?: number
  ): Promise<FeatureAccess> {
    try {
      // Get user's organization info, trial status, and check for special access
      const userQuery = `
        SELECT u.id, u.email, u.organization_id, u.metadata, u.trial_start_date, u.trial_end_date, u.is_on_trial,
               o.name as organization_name, o.current_subscription_plan, o.current_subscription_status
        FROM users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        WHERE u.id = $1
      `;
      const userResult = await this.databaseService.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        return {
          hasAccess: false,
          reason: 'User not found',
          upgradeRequired: 'growth'
        };
      }

      const user = userResult.rows[0];
      
      // Check for active coupon permissions first
      const couponPermissions = await this.couponsService.checkUserCouponPermissions(userId);
      if (couponPermissions) {
        if (couponPermissions.full_access || couponPermissions.bypass_subscription) {
          this.logger.log(`Coupon access granted for user: ${user.email}`);
          return { hasAccess: true, reason: 'Active coupon grants full access' };
        }
        
        // Check specific feature access from coupon
        if (couponPermissions.features?.includes(feature)) {
          this.logger.log(`Coupon feature access granted for ${feature} to user: ${user.email}`);
          return { hasAccess: true, reason: 'Feature access granted by active coupon' };
        }

        // Check unlimited permissions
        if (
          (feature === 'unlimited_questionnaires' && couponPermissions.unlimited_questionnaires) ||
          (feature === 'unlimited_vendors' && couponPermissions.unlimited_vendors) ||
          (feature === 'unlimited_users' && couponPermissions.unlimited_users) ||
          (feature === 'unlimited_storage' && couponPermissions.unlimited_storage) ||
          (feature === 'unlimited_frameworks' && couponPermissions.unlimited_frameworks)
        ) {
          this.logger.log(`Coupon unlimited access granted for ${feature} to user: ${user.email}`);
          return { hasAccess: true, reason: 'Unlimited access granted by active coupon' };
        }

        // Check plan override
        if (couponPermissions.plan_override) {
          return this.checkPlanFeatureAccess(couponPermissions.plan_override, feature, currentUsage);
        }
      }
      
      // Check for special testing accounts that bypass subscription requirements
      if (user.metadata?.special_access === true || user.metadata?.bypass_subscription === true) {
        this.logger.log(`Special access granted for testing user: ${user.email}`);
        return { hasAccess: true, reason: 'Special testing account access' };
      }
      
      // Check for specific testing emails as additional safeguard
      if (['testing1@garnetai.net', 'testing2@garnetai.net'].includes(user.email)) {
        this.logger.log(`Special access granted for known testing email: ${user.email}`);
        return { hasAccess: true, reason: 'Testing account bypass' };
      }

      // Check for active free trial
      if (user.is_on_trial && user.trial_end_date) {
        const now = new Date();
        const trialEndDate = new Date(user.trial_end_date);
        
        if (now <= trialEndDate) {
          this.logger.log(`Free trial access granted for user: ${user.email} (expires: ${trialEndDate})`);
          // During trial, user gets starter plan features
          return this.checkPlanFeatureAccess('starter', feature, currentUsage);
        } else {
          this.logger.log(`Free trial expired for user: ${user.email} (expired: ${trialEndDate})`);
          // Trial expired - deny access and require subscription
          return {
            hasAccess: false,
            reason: 'Your 7-day free trial has expired. Please subscribe to continue using the platform.',
            upgradeRequired: 'growth',
            trialExpired: true
          };
        }
      }
      
      if (!user.organization_id) {
        // Fallback to individual user subscription for users not in an organization
        const subscription = await this.billingService.getUserSubscription(userId);
        const planId = subscription?.planId || 'starter';
        return this.checkPlanFeatureAccess(planId, feature, currentUsage);
      }

      // Check organization subscription
      const organizationId = user.organization_id;
      const orgSubscription = await this.billingService.getOrganizationSubscription(organizationId);
      
      let planId = 'starter'; // Default plan
      let subscriptionStatus = 'inactive';
      
      if (orgSubscription && orgSubscription.status === 'active') {
        planId = orgSubscription.planId;
        subscriptionStatus = 'active';
      } else if (user.current_subscription_plan) {
        // Use organization's current plan even if subscription is not active (grace period)
        planId = user.current_subscription_plan;
        subscriptionStatus = user.current_subscription_status || 'inactive';
      }

      return this.checkPlanFeatureAccess(planId, feature, currentUsage);
    } catch (error) {
      this.logger.error('Failed to check feature access', error);
      return {
        hasAccess: false,
        reason: 'Error checking subscription',
        upgradeRequired: 'growth'
      };
    }
  }

  private checkPlanFeatureAccess(planId: string, feature: string, currentUsage?: number): FeatureAccess {
    const tier = getPricingTierById(planId);

    if (!tier) {
      return {
        hasAccess: false,
        reason: 'Invalid subscription plan',
        upgradeRequired: 'growth'
      };
    }

    // Check specific features
    switch (feature) {
      case 'ai_automation':
        if (planId === 'starter') {
          return {
            hasAccess: false,
            reason: 'AI automation is not available on the Starter plan',
            upgradeRequired: 'growth'
          };
        }
        return { hasAccess: true };

      case 'unlimited_questionnaires':
        if (planId === 'starter') {
          const limit = tier.limits.questionnaires as number;
          if (currentUsage && currentUsage >= limit) {
            return {
              hasAccess: false,
              reason: `You've reached the limit of ${limit} questionnaires on the Starter plan`,
              upgradeRequired: 'growth'
            };
          }
        }
        return { hasAccess: true };

      case 'unlimited_vendors':
        if (planId === 'starter') {
          const limit = tier.limits.vendors as number;
          if (currentUsage && currentUsage >= limit) {
            return {
              hasAccess: false,
              reason: `You've reached the limit of ${limit} vendors on the Starter plan`,
              upgradeRequired: 'growth'
            };
          }
        }
        return { hasAccess: true };

      case 'multiple_frameworks':
        if (planId === 'starter') {
          return {
            hasAccess: false,
            reason: 'Multiple compliance frameworks are not available on the Starter plan',
            upgradeRequired: 'growth'
          };
        }
        return { hasAccess: true };

      case 'advanced_analytics':
        if (['starter', 'growth'].includes(planId)) {
          return {
            hasAccess: false,
            reason: 'Advanced analytics are only available on Scale and Enterprise plans',
            upgradeRequired: 'scale'
          };
        }
        return { hasAccess: true };

      case 'priority_support':
        if (['starter'].includes(planId)) {
          return {
            hasAccess: false,
            reason: 'Priority support is not available on the Starter plan',
            upgradeRequired: 'growth'
          };
        }
        return { hasAccess: true };

      case 'api_access':
        if (['starter', 'growth', 'scale'].includes(planId)) {
          return {
            hasAccess: false,
            reason: 'API access is only available on the Enterprise plan',
            upgradeRequired: 'enterprise'
          };
        }
        return { hasAccess: true };

      case 'white_labeling':
        if (planId !== 'enterprise') {
          return {
            hasAccess: false,
            reason: 'White labeling is only available on the Enterprise plan',
            upgradeRequired: 'enterprise'
          };
        }
        return { hasAccess: true };

      case 'custom_integrations':
        if (planId !== 'enterprise') {
          return {
            hasAccess: false,
            reason: 'Custom integrations are only available on the Enterprise plan',
            upgradeRequired: 'enterprise'
          };
        }
        return { hasAccess: true };

      case 'dedicated_support':
        if (planId !== 'enterprise') {
          return {
            hasAccess: false,
            reason: 'Dedicated support is only available on the Enterprise plan',
            upgradeRequired: 'enterprise'
          };
        }
        return { hasAccess: true };

      default:
        // For any other feature, check if it's in the plan's feature list
        const hasFeature = tier.features.some(f => 
          f.toLowerCase().includes(feature.toLowerCase())
        );
        
        if (!hasFeature) {
          return {
            hasAccess: false,
            reason: `Feature "${feature}" is not available on the ${tier.name} plan`,
            upgradeRequired: planId === 'starter' ? 'growth' : 
                           planId === 'growth' ? 'scale' : 'enterprise'
          };
        }
        
        return { hasAccess: true };
    }
  }

  async checkUserLimits(userId: string): Promise<{
    questionnaires: { current: number; limit: number | 'unlimited'; hasAccess: boolean };
    vendors: { current: number; limit: number | 'unlimited'; hasAccess: boolean };
    users: { current: number; limit: number | 'unlimited'; hasAccess: boolean };
    storage: { current: string; limit: string; hasAccess: boolean };
  }> {
    try {
      // Get user's organization info, trial status, and check for special access
      const userQuery = `
        SELECT u.id, u.email, u.organization_id, u.metadata, u.trial_start_date, u.trial_end_date, u.is_on_trial,
               o.name as organization_name
        FROM users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        WHERE u.id = $1
      `;
      const userResult = await this.databaseService.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];
      
      // Check for active coupon permissions first
      const couponPermissions = await this.couponsService.checkUserCouponPermissions(userId);
      if (couponPermissions && (couponPermissions.full_access || couponPermissions.bypass_subscription)) {
        this.logger.log(`Coupon unlimited access granted for user: ${user.email}`);
        
        return {
          questionnaires: {
            current: 0,
            limit: 'unlimited',
            hasAccess: true
          },
          vendors: {
            current: 0,
            limit: 'unlimited',
            hasAccess: true
          },
          users: {
            current: 1,
            limit: 'unlimited',
            hasAccess: true
          },
          storage: {
            current: '0GB',
            limit: 'Unlimited',
            hasAccess: true
          }
        };
      }
      
      // Check for special testing accounts that bypass subscription requirements
      if (user.metadata?.special_access === true || user.metadata?.bypass_subscription === true || 
          ['testing1@garnetai.net', 'testing2@garnetai.net'].includes(user.email)) {
        
        this.logger.log(`Special unlimited access granted for testing user: ${user.email}`);
        
        return {
          questionnaires: {
            current: 0,
            limit: 'unlimited',
            hasAccess: true
          },
          vendors: {
            current: 0,
            limit: 'unlimited',
            hasAccess: true
          },
          users: {
            current: 1,
            limit: 'unlimited',
            hasAccess: true
          },
          storage: {
            current: '0GB',
            limit: 'Unlimited',
            hasAccess: true
          }
        };
      }

      // Check for active free trial
      if (user.is_on_trial && user.trial_end_date) {
        const now = new Date();
        const trialEndDate = new Date(user.trial_end_date);
        
        if (now <= trialEndDate) {
          this.logger.log(`Free trial limits applied for user: ${user.email} (expires: ${trialEndDate})`);
          // Use starter plan limits during trial
          const tier = getPricingTierById('starter');
          if (!tier) {
            throw new Error('Starter plan not found');
          }
          const currentUsage = await this.getCurrentUsage(userId);
          
          return {
            questionnaires: {
              current: currentUsage.questionnaires,
              limit: tier.limits.questionnaires,
              hasAccess: tier.limits.questionnaires === 'unlimited' || 
                        currentUsage.questionnaires < (tier.limits.questionnaires as number)
            },
            vendors: {
              current: currentUsage.vendors,
              limit: tier.limits.vendors,
              hasAccess: tier.limits.vendors === 'unlimited' || 
                        currentUsage.vendors < (tier.limits.vendors as number)
            },
            users: {
              current: currentUsage.users,
              limit: tier.limits.users,
              hasAccess: tier.limits.users === 'unlimited' || 
                        currentUsage.users < (tier.limits.users as number)
            },
            storage: {
              current: currentUsage.storage,
              limit: tier.limits.storage,
              hasAccess: true
            }
          };
        } else {
          this.logger.log(`Free trial expired for user: ${user.email} (expired: ${trialEndDate})`);
          // Trial expired - return zero limits
          return {
            questionnaires: {
              current: 0,
              limit: 0,
              hasAccess: false
            },
            vendors: {
              current: 0,
              limit: 0,
              hasAccess: false
            },
            users: {
              current: 1,
              limit: 0,
              hasAccess: false
            },
            storage: {
              current: '0GB',
              limit: '0GB',
              hasAccess: false
            }
          };
        }
      }
      
      let planId = 'starter';
      
      if (userResult.rows.length > 0 && userResult.rows[0].organization_id) {
        // Get organization subscription
        const organizationId = userResult.rows[0].organization_id;
        const orgSubscription = await this.billingService.getOrganizationSubscription(organizationId);
        
        if (orgSubscription && orgSubscription.status === 'active') {
          planId = orgSubscription.planId;
        }
      } else {
        // Fallback to individual subscription
        const subscription = await this.billingService.getUserSubscription(userId);
        planId = subscription?.planId || 'starter';
      }

      const tier = getPricingTierById(planId);

      if (!tier) {
        throw new Error('Invalid subscription plan');
      }

      // Get actual usage counts (you would implement these queries based on your data)
      const currentUsage = await this.getCurrentUsage(userId);

      return {
        questionnaires: {
          current: currentUsage.questionnaires,
          limit: tier.limits.questionnaires,
          hasAccess: tier.limits.questionnaires === 'unlimited' || 
                    currentUsage.questionnaires < (tier.limits.questionnaires as number)
        },
        vendors: {
          current: currentUsage.vendors,
          limit: tier.limits.vendors,
          hasAccess: tier.limits.vendors === 'unlimited' || 
                    currentUsage.vendors < (tier.limits.vendors as number)
        },
        users: {
          current: currentUsage.users,
          limit: tier.limits.users,
          hasAccess: tier.limits.users === 'unlimited' || 
                    currentUsage.users < (tier.limits.users as number)
        },
        storage: {
          current: currentUsage.storage,
          limit: tier.limits.storage,
          hasAccess: true // Simplified for now
        }
      };
    } catch (error) {
      this.logger.error('Failed to check user limits', error);
      throw error;
    }
  }

  private async getCurrentUsage(userId: string): Promise<{
    questionnaires: number;
    vendors: number;
    users: number;
    storage: string;
  }> {
    // Get user's organization to check organization-wide usage
    const userQuery = `
      SELECT u.organization_id FROM users u WHERE u.id = $1
    `;
    const userResult = await this.databaseService.query(userQuery, [userId]);
    
    const organizationId = userResult.rows[0]?.organization_id;
    
    if (organizationId) {
      // Get organization-wide usage with monthly tracking for questionnaires
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const usageQuery = `
        SELECT 
          COUNT(DISTINCT CASE 
            WHEN vqa.created_at >= $2 AND vqa.question = '__QUESTIONNAIRE_TITLE__' THEN vqa.vendor_id 
            ELSE NULL 
          END) as questionnaire_count,
          COUNT(DISTINCT v.vendor_id) as vendor_count,
          COUNT(DISTINCT u.id) as user_count
        FROM organizations o
        LEFT JOIN users u ON o.id = u.organization_id AND u.is_active = true
        LEFT JOIN vendors v ON u.id = v.created_by_user_id
        LEFT JOIN vendor_questionnaire_answers vqa ON v.vendor_id = vqa.vendor_id
        WHERE o.id = $1
        GROUP BY o.id
      `;
      
      const usageResult = await this.databaseService.query(usageQuery, [organizationId, firstDayOfMonth]);
      
      if (usageResult.rows.length > 0) {
        const usage = usageResult.rows[0];
        const vendorCount = parseInt(usage.vendor_count) || 0;
        const questionnaireCount = parseInt(usage.questionnaire_count) || 0;
        
        this.logger.log(`Usage for organization ${organizationId}: vendors=${vendorCount}, questionnaires=${questionnaireCount}, users=${usage.user_count}`);
        
        return {
          questionnaires: questionnaireCount, // Monthly count
          vendors: vendorCount, // Total count
          users: parseInt(usage.user_count) || 0,
          storage: '0GB' // Placeholder
        };
      }
    }
    
    // Fallback to individual user usage (monthly for questionnaires)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const individualUsageQuery = `
      SELECT 
        COUNT(DISTINCT CASE 
          WHEN vqa.created_at >= $2 AND vqa.question = '__QUESTIONNAIRE_TITLE__' THEN vqa.vendor_id 
          ELSE NULL 
        END) as questionnaire_count,
        COUNT(DISTINCT v.vendor_id) as vendor_count
      FROM users u
      LEFT JOIN vendors v ON u.id = v.created_by_user_id
      LEFT JOIN vendor_questionnaire_answers vqa ON v.vendor_id = vqa.vendor_id
      WHERE u.id = $1
    `;
    
    const individualResult = await this.databaseService.query(individualUsageQuery, [userId, firstDayOfMonth]);
    
    if (individualResult.rows.length > 0) {
      const usage = individualResult.rows[0];
      return {
        questionnaires: parseInt(usage.questionnaire_count) || 0, // Monthly count
        vendors: parseInt(usage.vendor_count) || 0, // Total count
        users: 1,
        storage: '0GB'
      };
    }
    
    return {
      questionnaires: 0,
      vendors: 0,
      users: 1,
      storage: '0GB'
    };
  }

  // Helper method to automatically expire trials
  async expireTrialsIfNeeded(): Promise<void> {
    try {
      const now = new Date();
      
      // Find all users with expired trials
      const expiredTrialsQuery = `
        UPDATE users 
        SET is_on_trial = FALSE, subscription_status = 'inactive'
        WHERE is_on_trial = TRUE 
        AND trial_end_date < $1
        RETURNING email, trial_end_date
      `;
      
      const result = await this.databaseService.query(expiredTrialsQuery, [now]);
      
      if (result.rows.length > 0) {
        this.logger.log(`Expired ${result.rows.length} trial(s)`);
        result.rows.forEach(user => {
          this.logger.log(`Trial expired for user: ${user.email} (expired: ${user.trial_end_date})`);
        });
      }
    } catch (error) {
      this.logger.error('Failed to expire trials', error);
    }
  }

  // Helper method to check trial status for a user
  async checkTrialStatus(userId: string): Promise<{
    isOnTrial: boolean;
    trialEndDate?: Date;
    daysRemaining?: number;
    isExpired: boolean;
  }> {
    try {
      const userQuery = `
        SELECT trial_start_date, trial_end_date, is_on_trial
        FROM users 
        WHERE id = $1
      `;
      
      const result = await this.databaseService.query(userQuery, [userId]);
      
      if (result.rows.length === 0) {
        return { isOnTrial: false, isExpired: false };
      }
      
      const user = result.rows[0];
      
      if (!user.is_on_trial || !user.trial_end_date) {
        return { isOnTrial: false, isExpired: false };
      }
      
      const now = new Date();
      const trialEndDate = new Date(user.trial_end_date);
      const isExpired = now > trialEndDate;
      
      if (isExpired) {
        // Automatically expire the trial
        await this.databaseService.query(
          `UPDATE users SET is_on_trial = FALSE, subscription_status = 'inactive' WHERE id = $1`,
          [userId]
        );
        this.logger.log(`Auto-expired trial for user: ${userId}`);
        return { isOnTrial: false, isExpired: true, trialEndDate };
      }
      
      const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        isOnTrial: true,
        trialEndDate,
        daysRemaining,
        isExpired: false
      };
    } catch (error) {
      this.logger.error('Failed to check trial status', error);
      return { isOnTrial: false, isExpired: false };
    }
  }

  // Helper method to check organization subscription status
  async getOrganizationSubscriptionStatus(organizationId: string): Promise<{
    hasActiveSubscription: boolean;
    planId: string;
    status: string;
    expiresAt?: Date;
    userCount: number;
    maxUsers: number;
  }> {
    try {
      const statusQuery = `
        SELECT * FROM get_organization_subscription_status($1)
      `;
      const result = await this.databaseService.query(statusQuery, [organizationId]);
      
      if (result.rows.length === 0) {
        return {
          hasActiveSubscription: false,
          planId: 'starter',
          status: 'inactive',
          userCount: 0,
          maxUsers: 10
        };
      }
      
      const status = result.rows[0];
      return {
        hasActiveSubscription: status.has_active_subscription,
        planId: status.plan_id,
        status: status.status,
        expiresAt: status.expires_at,
        userCount: status.user_count,
        maxUsers: status.max_users
      };
    } catch (error) {
      this.logger.error('Failed to get organization subscription status', error);
      return {
        hasActiveSubscription: false,
        planId: 'starter',
        status: 'error',
        userCount: 0,
        maxUsers: 10
      };
    }
  }
} 