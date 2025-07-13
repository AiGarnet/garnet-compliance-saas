import { Injectable } from '@nestjs/common';
import { PRICING_TIERS, getPricingTierById } from '../config/pricing';
import { BillingService } from './billing.service';

export interface FeatureAccess {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: string;
}

@Injectable()
export class FeatureAccessService {
  constructor(private readonly billingService: BillingService) {}

  async checkFeatureAccess(
    userId: string,
    feature: string,
    currentUsage?: number
  ): Promise<FeatureAccess> {
    // Get user's current subscription
    const subscription = await this.billingService.getUserSubscription(userId);
    const planId = subscription?.planId || 'starter';
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

      case 'advanced_analytics':
        if (planId === 'starter' || planId === 'growth') {
          return {
            hasAccess: false,
            reason: 'Advanced analytics is only available on Scale and Enterprise plans',
            upgradeRequired: 'scale'
          };
        }
        return { hasAccess: true };

      case 'api_access':
        if (planId === 'starter' || planId === 'growth') {
          return {
            hasAccess: false,
            reason: 'API access is only available on Scale and Enterprise plans',
            upgradeRequired: 'scale'
          };
        }
        return { hasAccess: true };

      case 'sso_integration':
        if (planId === 'starter' || planId === 'growth') {
          return {
            hasAccess: false,
            reason: 'SSO integration is only available on Scale and Enterprise plans',
            upgradeRequired: 'scale'
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
        if (planId === 'starter' || planId === 'growth') {
          return {
            hasAccess: false,
            reason: 'Dedicated support is only available on Scale and Enterprise plans',
            upgradeRequired: 'scale'
          };
        }
        return { hasAccess: true };

      case 'trust_portal':
        if (planId === 'starter') {
          return {
            hasAccess: false,
            reason: 'Trust portal is not available on the Starter plan',
            upgradeRequired: 'growth'
          };
        }
        return { hasAccess: true };

      case 'custom_branding':
        if (planId === 'starter') {
          return {
            hasAccess: false,
            reason: 'Custom branding is not available on the Starter plan',
            upgradeRequired: 'growth'
          };
        }
        return { hasAccess: true };

      case 'bulk_operations':
        if (planId === 'starter' || planId === 'growth') {
          return {
            hasAccess: false,
            reason: 'Bulk operations are only available on Scale and Enterprise plans',
            upgradeRequired: 'scale'
          };
        }
        return { hasAccess: true };

      case 'priority_support':
        if (planId === 'starter') {
          return {
            hasAccess: false,
            reason: 'Priority support is not available on the Starter plan',
            upgradeRequired: 'growth'
          };
        }
        return { hasAccess: true };

      default:
        // For unknown features, allow access for all paid plans
        return { hasAccess: planId !== 'starter' };
    }
  }

  async checkUserLimits(userId: string): Promise<{
    questionnaires: { current: number; limit: number | 'unlimited'; hasAccess: boolean };
    vendors: { current: number; limit: number | 'unlimited'; hasAccess: boolean };
    users: { current: number; limit: number | 'unlimited'; hasAccess: boolean };
    storage: { current: string; limit: string; hasAccess: boolean };
  }> {
    const subscription = await this.billingService.getUserSubscription(userId);
    const planId = subscription?.planId || 'starter';
    const tier = getPricingTierById(planId);

    if (!tier) {
      throw new Error('Invalid subscription plan');
    }

    // TODO: Implement actual usage tracking
    // For now, return mock data
    return {
      questionnaires: {
        current: 0,
        limit: tier.limits.questionnaires,
        hasAccess: true
      },
      vendors: {
        current: 0,
        limit: tier.limits.vendors,
        hasAccess: true
      },
      users: {
        current: 1,
        limit: tier.limits.users,
        hasAccess: true
      },
      storage: {
        current: '0GB',
        limit: tier.limits.storage,
        hasAccess: true
      }
    };
  }

  async getPlanFeatures(planId: string): Promise<string[]> {
    const tier = getPricingTierById(planId);
    return tier?.features || [];
  }

  async getUpgradeRecommendation(userId: string, requiredFeature: string): Promise<{
    currentPlan: string;
    recommendedPlan: string;
    reason: string;
    features: string[];
  }> {
    const subscription = await this.billingService.getUserSubscription(userId);
    const currentPlan = subscription?.planId || 'starter';
    
    const featureAccess = await this.checkFeatureAccess(userId, requiredFeature);
    
    if (featureAccess.hasAccess) {
      return {
        currentPlan,
        recommendedPlan: currentPlan,
        reason: 'Feature already available',
        features: await this.getPlanFeatures(currentPlan)
      };
    }

    const recommendedPlan = featureAccess.upgradeRequired || 'growth';
    const recommendedTier = getPricingTierById(recommendedPlan);

    return {
      currentPlan,
      recommendedPlan,
      reason: featureAccess.reason || 'Upgrade required for this feature',
      features: recommendedTier?.features || []
    };
  }
} 