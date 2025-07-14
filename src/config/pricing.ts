export interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    annual: number;
  };
  features: string[];
  limits: {
    questionnaires: number | 'unlimited';
    vendors: number | 'unlimited';
    users: number | 'unlimited';
    storage: string;
    frameworks: string[];
    dataRetention: string;
    support: string;
  };
  popular?: boolean;
  stripePriceIds?: {
    monthly?: string;
    annual?: string;
  };
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for individuals and solopreneurs getting started',
    price: {
      monthly: 1,
      annual: 10, // ~17% discount
    },
    features: [
      'AI-assisted questionnaire answering',
      'Up to 2 questionnaires per month',
      'Single compliance framework checklist (GDPR)',
      'Basic Trust Portal with one document upload',
      'Community support via knowledge base',
      'In-memory processing only',
    ],
    limits: {
      questionnaires: 2,
      vendors: 1,
      users: 1,
      storage: '0GB', // No permanent storage
      frameworks: ['GDPR'],
      dataRetention: '7 days',
      support: 'Community (knowledge base)',
    },
    stripePriceIds: {
      monthly: 'prod_Sfp1VRqDGvVRx7',
      annual: 'prod_Sfp1ZWsl26QR25',
    },
  },
  {
    id: 'growth',
    name: 'Growth (Startup)',
    description: 'For early-stage startups needing regular compliance automation',
    price: {
      monthly: 49,
      annual: 490, // ~17% discount (billed annually only)
    },
    features: [
      'Everything in Starter',
      'Unlimited AI-generated questionnaires (up to 100 questions each)',
      'Support for up to 3 compliance frameworks',
      'Enhanced Trust Portal customization (logo + two documents)',
      'Email support with 48-hour SLA',
      'Exportable audit logs',
      'Basic analytics dashboard',
    ],
    limits: {
      questionnaires: 'unlimited',
      vendors: 'unlimited',
      users: 3,
      storage: '5GB',
      frameworks: ['GDPR', 'PDPA', 'SOC 2'],
      dataRetention: '30 days',
      support: 'Email (48h SLA)',
    },
    popular: true,
    stripePriceIds: {
      monthly: 'prod_Sfp2fcOpPyqK0Z',
      annual: 'prod_Sfp2zDuOd8J0nV',
    },
  },
  {
    id: 'scale',
    name: 'Scale (SMB)',
    description: 'For small to mid-sized businesses with ongoing compliance demands',
    price: {
      monthly: 199,
      annual: 1990, // ~17% discount (billed annually only)
    },
    features: [
      'Everything in Growth',
      'Advanced context-aware AI suggestions',
      'Up to 10 compliance frameworks (AML, OFAC, FCPA, ISO 27001)',
      'Full Trust Portal: unlimited documents + custom subdomain',
      'Priority email support and live chat',
      'Advanced audit reports (PDF/CSV)',
      'Role-based access control (up to 5 sales professionals)',
      'Scheduled compliance reminders and expiry alerts',
    ],
    limits: {
      questionnaires: 'unlimited',
      vendors: 'unlimited',
      users: 6, // founder + 5 sales professionals
      storage: '50GB',
      frameworks: ['GDPR', 'PDPA', 'SOC 2', 'AML', 'OFAC', 'FCPA', 'ISO 27001', 'HIPAA', 'PCI DSS', 'Custom'],
      dataRetention: '1 year',
      support: 'Priority email + live chat',
    },
    stripePriceIds: {
      monthly: 'prod_Sfp3u5vmjT85eF',
      annual: 'prod_Sfp3XUakNwtOnM',
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise (Mid-Size)',
    description: 'For established companies with complex, multi-jurisdictional compliance needs',
    price: {
      monthly: 499, // Starting price
      annual: 4990, // Custom pricing - this is just the starting point
    },
    features: [
      'Everything in Scale',
      'Unlimited frameworks and user seats',
      'SLA-backed 24×7 support and dedicated account manager',
      'API access for integrations (SSO, ERP, HRIS)',
      'Advanced webhooks',
      'Quarterly compliance reviews and feature workshops',
      'Optional add-ons: automated sanctions/PEP screening',
      'AI fine-tuning',
      'Custom integrations',
    ],
    limits: {
      questionnaires: 'unlimited',
      vendors: 'unlimited',
      users: 'unlimited',
      storage: 'Unlimited',
      frameworks: ['All frameworks', 'Custom frameworks'],
      dataRetention: 'Unlimited',
      support: '24×7 dedicated support + account manager',
    },
    stripePriceIds: {
      // Enterprise is custom pricing - handled separately
      monthly: 'prod_Sfp4M6qs4B0onm',
      annual: 'prod_Sfp5HIpH9J8esc',
    },
  },
];

export const ANNUAL_DISCOUNT_PERCENTAGE = 17;

export function getPricingTierById(id: string): PricingTier | undefined {
  return PRICING_TIERS.find(tier => tier.id === id);
}

export function calculateAnnualSavings(monthlyPrice: number): number {
  const annualPrice = monthlyPrice * 12;
  const discountedAnnualPrice = annualPrice * (1 - ANNUAL_DISCOUNT_PERCENTAGE / 100);
  return annualPrice - discountedAnnualPrice;
} 