import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

export enum SubscriptionPlan {
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

export interface OrganizationSettings {
  features?: string[];
  theme?: string;
  maxVendors?: number;
  customBranding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  notifications?: {
    email?: boolean;
    slack?: boolean;
    teams?: boolean;
  };
  integrations?: {
    [key: string]: any;
  };
}

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, nullable: true })
  domain: string;

  @Column({
    name: 'subscription_plan',
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.BASIC
  })
  subscriptionPlan: SubscriptionPlan;

  @Column({ name: 'max_users', default: 10 })
  maxUsers: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  settings: OrganizationSettings;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @OneToMany('UserEntity', 'organizationEntity')
  users: any[];

  // Virtual properties
  get currentUserCount(): number {
    return this.users?.length || 0;
  }

  get canAddUsers(): boolean {
    return this.currentUserCount < this.maxUsers;
  }

  get isOverUserLimit(): boolean {
    return this.currentUserCount > this.maxUsers;
  }

  // Helper methods
  hasFeature(feature: string): boolean {
    return this.settings?.features?.includes(feature) || false;
  }

  getTheme(): string {
    return this.settings?.theme || 'default';
  }

  // Subscription plan checks
  get isBasicPlan(): boolean {
    return this.subscriptionPlan === SubscriptionPlan.BASIC;
  }

  get isProPlan(): boolean {
    return this.subscriptionPlan === SubscriptionPlan.PRO;
  }

  get isEnterprisePlan(): boolean {
    return this.subscriptionPlan === SubscriptionPlan.ENTERPRISE;
  }
} 