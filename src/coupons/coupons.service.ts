import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { 
  CreateCouponDto, 
  ValidateCouponDto, 
  ApplyCouponDto,
  CouponValidationResponseDto,
  ApplyCouponResponseDto,
  CouponResponseDto
} from './dto/coupon.dto';
import { Coupon, CouponUsage, CouponPermissions } from './entities/coupon.entity';

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async createCoupon(dto: CreateCouponDto, createdBy: string): Promise<CouponResponseDto> {
    try {
      // Check if coupon code already exists
      const existingQuery = 'SELECT id FROM coupons WHERE code = $1';
      const existingResult = await this.databaseService.query(existingQuery, [dto.code.toUpperCase()]);
      
      if (existingResult.rows.length > 0) {
        throw new ConflictException(`Coupon code '${dto.code}' already exists`);
      }

      const insertQuery = `
        INSERT INTO coupons (
          code, name, description, permissions, usage_limit, 
          valid_from, valid_until, created_by, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      const values = [
        dto.code.toUpperCase(),
        dto.name,
        dto.description || null,
        JSON.stringify(dto.permissions),
        dto.usage_limit || null,
        new Date(dto.valid_from),
        dto.valid_until ? new Date(dto.valid_until) : null,
        createdBy
      ];

      const result = await this.databaseService.query(insertQuery, values);
      const coupon = result.rows[0];

      this.logger.log(`Created coupon: ${coupon.code} by user: ${createdBy}`);

      return this.formatCouponResponse(coupon);
    } catch (error) {
      this.logger.error('Failed to create coupon', error);
      throw error;
    }
  }

  async validateCoupon(dto: ValidateCouponDto): Promise<CouponValidationResponseDto> {
    try {
      const coupon = await this.getCouponByCode(dto.code);

      if (!coupon) {
        return {
          valid: false,
          message: 'Invalid coupon code',
        };
      }

      if (!coupon.is_active) {
        return {
          valid: false,
          message: 'This coupon is no longer active',
        };
      }

      const now = new Date();
      if (now < coupon.valid_from) {
        return {
          valid: false,
          message: 'This coupon is not yet valid',
        };
      }

      if (coupon.valid_until && now > coupon.valid_until) {
        return {
          valid: false,
          message: 'This coupon has expired',
        };
      }

      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        return {
          valid: false,
          message: 'This coupon has reached its usage limit',
        };
      }

      return {
        valid: true,
        message: 'Coupon is valid and ready to use',
        coupon: this.formatCouponResponse(coupon),
        permissions: coupon.permissions,
      };
    } catch (error) {
      this.logger.error('Failed to validate coupon', error);
      throw new BadRequestException('Failed to validate coupon');
    }
  }

  async applyCoupon(dto: ApplyCouponDto, userId: string): Promise<ApplyCouponResponseDto> {
    try {
      // First validate the coupon
      const validation = await this.validateCoupon({ code: dto.code });
      
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message,
        };
      }

      const coupon = validation.coupon!;

      // Check if user has already used this coupon
      const existingUsageQuery = `
        SELECT id FROM coupon_usage 
        WHERE coupon_id = $1 AND user_id = $2 AND is_active = true
      `;
      const existingUsage = await this.databaseService.query(existingUsageQuery, [coupon.id, userId]);

      if (existingUsage.rows.length > 0) {
        return {
          success: false,
          message: 'You have already used this coupon',
        };
      }

      // Apply the coupon by creating usage record and updating user metadata
      const client = await this.databaseService.getConnection();
      
      try {
        await client.query('BEGIN');

        // All applied coupons now expire after 7 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Create coupon usage record
        const usageQuery = `
          INSERT INTO coupon_usage (coupon_id, user_id, expires_at, created_at)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
          RETURNING *
        `;
        await client.query(usageQuery, [coupon.id, userId, expiresAt]);

        // Update user metadata to include coupon permissions
        const updateUserQuery = `
          UPDATE users 
          SET metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING metadata
        `;

        const couponMetadata = {
          active_coupon: {
            code: coupon.code,
            permissions: coupon.permissions,
            applied_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
          },
          // Add flags for easy checking in feature access service
          ...(coupon.permissions.full_access && { full_access: true }),
          ...(coupon.permissions.bypass_subscription && { bypass_subscription: true }),
          ...(coupon.permissions.testing_access && { testing_access: true }),
        };

        await client.query(updateUserQuery, [JSON.stringify(couponMetadata), userId]);

        // Update coupon usage count
        const updateCouponQuery = `
          UPDATE coupons 
          SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `;
        await client.query(updateCouponQuery, [coupon.id]);

        await client.query('COMMIT');

        this.logger.log(`Applied coupon ${coupon.code} to user ${userId}`);

        return {
          success: true,
          message: `Coupon "${coupon.name}" applied successfully! You now have access to all premium features.`,
          coupon: this.formatCouponResponse(coupon),
          expires_at: expiresAt.toISOString(),
        };

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      this.logger.error('Failed to apply coupon', error);
      throw new BadRequestException('Failed to apply coupon');
    }
  }

  async getUserActiveCoupons(userId: string): Promise<CouponUsage[]> {
    try {
      const query = `
        SELECT cu.*, c.code, c.name, c.permissions
        FROM coupon_usage cu
        JOIN coupons c ON cu.coupon_id = c.id
        WHERE cu.user_id = $1 AND cu.is_active = true
        AND (cu.expires_at IS NULL OR cu.expires_at > CURRENT_TIMESTAMP)
        ORDER BY cu.applied_at DESC
      `;

      const result = await this.databaseService.query(query, [userId]);
      return result.rows;
    } catch (error) {
      this.logger.error('Failed to get user active coupons', error);
      return [];
    }
  }

  async getCoupons(page: number = 1, limit: number = 50): Promise<{ coupons: CouponResponseDto[]; total: number }> {
    try {
      const offset = (page - 1) * limit;

      const countQuery = 'SELECT COUNT(*) FROM coupons';
      const countResult = await this.databaseService.query(countQuery);
      const total = parseInt(countResult.rows[0].count);

      const query = `
        SELECT * FROM coupons
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const result = await this.databaseService.query(query, [limit, offset]);
      const coupons = result.rows.map(coupon => this.formatCouponResponse(coupon));

      return { coupons, total };
    } catch (error) {
      this.logger.error('Failed to get coupons', error);
      throw new BadRequestException('Failed to retrieve coupons');
    }
  }

  async deactivateCoupon(couponId: string, userId: string): Promise<void> {
    try {
      const query = `
        UPDATE coupons 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await this.databaseService.query(query, [couponId]);
      this.logger.log(`Deactivated coupon ${couponId} by user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to deactivate coupon', error);
      throw new BadRequestException('Failed to deactivate coupon');
    }
  }

  private async getCouponByCode(code: string): Promise<Coupon | null> {
    const query = 'SELECT * FROM coupons WHERE code = $1';
    const result = await this.databaseService.query(query, [code.toUpperCase()]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      permissions: row.permissions,
      usage_limit: row.usage_limit,
      usage_count: row.usage_count,
      valid_from: row.valid_from,
      valid_until: row.valid_until,
      is_active: row.is_active,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private formatCouponResponse(coupon: any): CouponResponseDto {
    return {
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      permissions: coupon.permissions,
      usage_limit: coupon.usage_limit,
      usage_count: coupon.usage_count,
      valid_from: coupon.valid_from?.toISOString() || coupon.valid_from,
      valid_until: coupon.valid_until?.toISOString() || coupon.valid_until,
      is_active: coupon.is_active,
      created_by: coupon.created_by,
      created_at: coupon.created_at?.toISOString() || coupon.created_at,
    };
  }

  // Helper method to check if user has active coupon with specific permissions
  async checkUserCouponPermissions(userId: string): Promise<CouponPermissions | null> {
    try {
      const userQuery = `
        SELECT metadata FROM users WHERE id = $1
      `;
      const userResult = await this.databaseService.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        return null;
      }

      const metadata = userResult.rows[0].metadata;
      if (!metadata?.active_coupon) {
        return null;
      }

      const activeCoupon = metadata.active_coupon;
      
      // Check if coupon is still valid
      if (activeCoupon.expires_at && new Date() > new Date(activeCoupon.expires_at)) {
        return null;
      }

      return activeCoupon.permissions;
    } catch (error) {
      this.logger.error('Failed to check user coupon permissions', error);
      return null;
    }
  }
} 