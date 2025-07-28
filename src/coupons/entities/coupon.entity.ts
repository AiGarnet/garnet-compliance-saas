import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  permissions: CouponPermissions;
  usage_limit?: number;
  usage_count: number;
  valid_from: Date;
  valid_until?: Date;
  is_active: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CouponPermissions {
  // Feature access
  full_access?: boolean; // Grants access to all features
  features?: string[]; // Specific features to grant access to
  plan_override?: string; // Override to specific plan (starter, growth, scale, enterprise)
  
  // Limits override
  unlimited_questionnaires?: boolean;
  unlimited_vendors?: boolean;
  unlimited_users?: boolean;
  unlimited_storage?: boolean;
  unlimited_frameworks?: boolean;
  
  // Special flags
  bypass_subscription?: boolean;
  testing_access?: boolean;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  user_id: string;
  applied_at: Date;
  expires_at?: Date;
  is_active: boolean;
}

@Entity('coupons')
export class CouponEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  permissions: CouponPermissions;

  @Column({ name: 'usage_limit', nullable: true })
  usageLimit: number;

  @Column({ name: 'usage_count', default: 0 })
  usageCount: number;

  @Column({ name: 'valid_from' })
  validFrom: Date;

  @Column({ name: 'valid_until', nullable: true })
  validUntil: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  toCoupon(): Coupon {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      description: this.description,
      permissions: this.permissions,
      usage_limit: this.usageLimit,
      usage_count: this.usageCount,
      valid_from: this.validFrom,
      valid_until: this.validUntil,
      is_active: this.isActive,
      created_by: this.createdBy,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }
}

@Entity('coupon_usage')
export class CouponUsageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coupon_id' })
  couponId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @CreateDateColumn({ name: 'applied_at' })
  appliedAt: Date;

  @Column({ name: 'expires_at', nullable: true })
  expiresAt: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  toCouponUsage(): CouponUsage {
    return {
      id: this.id,
      coupon_id: this.couponId,
      user_id: this.userId,
      applied_at: this.appliedAt,
      expires_at: this.expiresAt,
      is_active: this.isActive,
    };
  }
} 