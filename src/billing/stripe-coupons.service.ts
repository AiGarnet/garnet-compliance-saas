import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface StripeCoupon {
  id: string;
  stripe_coupon_id: string;
  code: string;
  name: string;
  description: string;
  discount_type: 'percentage' | 'amount';
  discount_value: number;
  usage_limit?: number;
  usage_count: number;
  valid_from: Date;
  valid_until?: Date;
  is_active: boolean;
}

@Injectable()
export class StripeCouponsService {
  private readonly logger = new Logger(StripeCouponsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async validateStripeCoupon(code: string): Promise<StripeCoupon | null> {
    try {
      const query = `
        SELECT * FROM stripe_coupons 
        WHERE code = $1 AND is_active = true
      `;
      const result = await this.databaseService.query(query, [code]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const coupon = result.rows[0];

      // Check if coupon is valid (time-wise)
      const now = new Date();
      if (now < coupon.valid_from) {
        this.logger.warn(`Coupon ${code} is not yet valid`);
        return null;
      }

      if (coupon.valid_until && now > coupon.valid_until) {
        this.logger.warn(`Coupon ${code} has expired`);
        return null;
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        this.logger.warn(`Coupon ${code} has reached usage limit`);
        return null;
      }

      return coupon;
    } catch (error) {
      this.logger.error('Failed to validate Stripe coupon', error);
      return null;
    }
  }

  async incrementCouponUsage(code: string): Promise<void> {
    try {
      const query = `
        UPDATE stripe_coupons 
        SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
        WHERE code = $1
      `;
      await this.databaseService.query(query, [code]);
      this.logger.log(`Incremented usage count for Stripe coupon: ${code}`);
    } catch (error) {
      this.logger.error(`Failed to increment usage for coupon ${code}`, error);
    }
  }

  async getStripeCouponId(code: string): Promise<string | null> {
    const coupon = await this.validateStripeCoupon(code);
    return coupon ? coupon.stripe_coupon_id : null;
  }
}