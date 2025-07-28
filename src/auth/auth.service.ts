import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { DatabaseService } from '../database/database.service';
import { User, CreateUserRequest, WaitlistSignupRequest, JwtPayload } from './entities/user.entity';
import { SignupDto, LoginDto, WaitlistSignupDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { OrganizationsService } from '../organizations/organizations.service';
import { EmailService } from '../common/email.service';
import { Logger } from '@nestjs/common';
import { CouponsService } from '../coupons/coupons.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly organizationsService: OrganizationsService,
    private readonly emailService: EmailService,
    private readonly couponsService: CouponsService,
  ) {}

  async signup(signupDto: SignupDto): Promise<{ access_token: string; user: Partial<User> }> {
    const existingUser = await this.getUserByEmail(signupDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(signupDto.password, 10);
    
    let organizationId: string | null = null;
    let organizationName = signupDto.organization;
    let couponMetadata = {};

    // Validate and apply coupon if provided
    if (signupDto.couponCode) {
      try {
        const couponValidation = await this.couponsService.validateCoupon({ 
          code: signupDto.couponCode.trim().toUpperCase() 
        });
        
        if (couponValidation.valid && couponValidation.coupon) {
          // Prepare coupon metadata for user
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7); // Coupon benefits expire after 7 days
          
          couponMetadata = {
            active_coupon: {
              code: couponValidation.coupon.code,
              permissions: couponValidation.permissions,
              applied_at: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
            },
            // Add flags for easy checking in feature access service
            ...(couponValidation.permissions?.full_access && { full_access: true }),
            ...(couponValidation.permissions?.bypass_subscription && { bypass_subscription: true }),
            ...(couponValidation.permissions?.testing_access && { testing_access: true }),
          };
          
          this.logger.log(`Applying coupon ${couponValidation.coupon.code} to new user ${signupDto.email}`);
        } else {
          this.logger.warn(`Invalid coupon code provided during signup: ${signupDto.couponCode}`);
          // Don't throw error, just continue without coupon
        }
      } catch (error) {
        this.logger.error('Error validating coupon during signup:', error);
        // Don't throw error, just continue without coupon
      }
    }

    // Auto-create or find organization if organization name is provided
    if (organizationName && organizationName.trim()) {
      try {
        // First, try to find existing organization by name
        const existingOrgs = await this.organizationsService.getAllOrganizations(1, 100);
        const existingOrg = existingOrgs.organizations.find(
          org => org.name.toLowerCase() === organizationName.toLowerCase()
        );

        if (existingOrg) {
          // Organization exists, use it
          organizationId = existingOrg.id;
          this.logger.log(`User joining existing organization: ${existingOrg.name} (${organizationId})`);
          
          // Check if organization has available user slots
          if (!existingOrg.canAddUsers) {
            throw new BadRequestException(
              `Organization "${existingOrg.name}" has reached its user limit of ${existingOrg.maxUsers} users`
            );
          }
        } else {
          // Organization doesn't exist, create it
          const newOrganization = await this.organizationsService.createOrganization({
            name: organizationName,
            maxUsers: 25, // Default to 25 users for new organizations
            settings: {
              features: ['compliance', 'vendors', 'questionnaires'],
              theme: 'default'
            }
          });
          organizationId = newOrganization.id;
          this.logger.log(`Created new organization: ${organizationName} (${organizationId})`);
        }
      } catch (error) {
        console.error('Error handling organization during signup:', error);
        // Continue without organization if there's an error
        organizationId = null;
      }
    }

    // Auto-assign user to organization based on email domain if no organization specified
    if (!organizationId && signupDto.email) {
      try {
        const autoAssignedOrg = await this.organizationsService.autoAssignUserByDomain(signupDto.email);
        if (autoAssignedOrg) {
          organizationId = autoAssignedOrg.id;
          organizationName = autoAssignedOrg.name;
          this.logger.log(`Auto-assigned user to organization based on email domain: ${autoAssignedOrg.name}`);
        }
      } catch (error) {
        this.logger.warn('Failed to auto-assign user by domain:', error);
      }
    }

    // Set up 7-day free trial
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialStartDate.getDate() + 7); // 7 days from now

    // Merge coupon metadata with any existing metadata
    const userMetadata = {
      ...signupDto.metadata,
      ...couponMetadata,
    };

    const query = `
      INSERT INTO users (
        email, password_hash, full_name, role, organization, organization_id, metadata, is_active,
        trial_start_date, trial_end_date, is_on_trial, subscription_plan, subscription_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, email, full_name, role, organization, organization_id, trial_start_date, trial_end_date, is_on_trial, created_at, updated_at
    `;

    const values = [
      signupDto.email.toLowerCase(),
      hashedPassword,
      signupDto.full_name,
      signupDto.role,
      organizationName || null, // Keep legacy field for backwards compatibility
      organizationId, // New organization_id field
      userMetadata,
      true,
      trialStartDate, // trial_start_date
      trialEndDate,   // trial_end_date
      true,           // is_on_trial
      'starter',      // subscription_plan (starter plan limits during trial)
      'trial',        // subscription_status
    ];

    const result = await this.databaseService.query(query, values);
    const user = result.rows[0];

    this.logger.log(`User ${user.email} signed up with 7-day free trial (expires: ${user.trial_end_date})`);

    // If a valid coupon was applied, create coupon usage record
    if (signupDto.couponCode && userMetadata.active_coupon) {
      try {
        await this.couponsService.applyCoupon(
          { code: signupDto.couponCode.trim().toUpperCase() },
          user.id
        );
        this.logger.log(`Coupon usage recorded for user ${user.id} with code ${signupDto.couponCode}`);
      } catch (error) {
        this.logger.error('Failed to create coupon usage record:', error);
        // Don't fail signup if coupon usage recording fails
      }
    }

    // If user joined an organization, log subscription information
    if (organizationId) {
      try {
        // Check if organization has an active subscription
        const orgStatusQuery = `
          SELECT 
            o.current_subscription_plan,
            o.current_subscription_status,
            os.plan_id as active_plan_id,
            os.status as active_status
          FROM organizations o
          LEFT JOIN organization_subscriptions os ON o.id = os.organization_id 
            AND os.status IN ('active', 'past_due')
          WHERE o.id = $1
        `;
        const orgStatusResult = await this.databaseService.query(orgStatusQuery, [organizationId]);
        
        if (orgStatusResult.rows.length > 0) {
          const orgStatus = orgStatusResult.rows[0];
          if (orgStatus.active_plan_id) {
            this.logger.log(`User ${user.email} automatically gained access to organization's ${orgStatus.active_plan_id} subscription`);
          } else if (orgStatus.current_subscription_plan) {
            this.logger.log(`User ${user.email} joined organization with ${orgStatus.current_subscription_plan} plan (status: ${orgStatus.current_subscription_status})`);
          }
        }
      } catch (error) {
        this.logger.warn('Failed to check organization subscription status:', error);
      }
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organization_id: user.organization_id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        organization: user.organization,
        organization_id: user.organization_id,
        trial_start_date: user.trial_start_date,
        trial_end_date: user.trial_end_date,
        is_on_trial: user.is_on_trial,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; user: Partial<User> }> {
    const user = await this.getUserByEmail(loginDto.email);
    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organization_id: user.organization_id, // SECURITY FIX: Include organization_id in JWT
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        organization: user.organization,
        organization_id: user.organization_id, // Include organization_id in response
      },
    };
  }

  async waitlistSignup(waitlistDto: WaitlistSignupDto): Promise<{ message: string; token: string; user: Partial<User> }> {
    const existingUser = await this.getUserByEmail(waitlistDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Validate role (must be sales_professional or founder)
    if (!['sales_professional', 'founder'].includes(waitlistDto.role)) {
      throw new UnauthorizedException('Role must be either "Sales Professional" or "Founder"');
    }

    const hashedPassword = await bcrypt.hash(waitlistDto.password, 10);

    let organizationId: string | null = null;
    let organizationName = waitlistDto.organization;

    // Auto-create or find organization if organization name is provided
    if (organizationName && organizationName.trim()) {
      try {
        // First, try to find existing organization by name
        const existingOrgs = await this.organizationsService.getAllOrganizations(1, 100);
        const existingOrg = existingOrgs.organizations.find(
          org => org.name.toLowerCase() === organizationName.toLowerCase()
        );

        if (existingOrg) {
          // Organization exists, use it
          organizationId = existingOrg.id;
          this.logger.log(`User joining existing organization via waitlist: ${existingOrg.name} (${organizationId})`);
          
          // Check if organization has available user slots
          if (!existingOrg.canAddUsers) {
            throw new BadRequestException(
              `Organization "${existingOrg.name}" has reached its user limit of ${existingOrg.maxUsers} users`
            );
          }
        } else {
          // Organization doesn't exist, create it
          const newOrganization = await this.organizationsService.createOrganization({
            name: organizationName,
            maxUsers: 25, // Default to 25 users for new organizations
            settings: {
              features: ['compliance', 'vendors', 'questionnaires'],
              theme: 'default'
            }
          });
          organizationId = newOrganization.id;
          this.logger.log(`Created new organization via waitlist: ${organizationName} (${organizationId})`);
        }
      } catch (error) {
        console.error('Error handling organization during waitlist signup:', error);
        // Continue without organization if there's an error
        organizationId = null;
      }
    }

    // Auto-assign user to organization based on email domain if no organization specified
    if (!organizationId && waitlistDto.email) {
      try {
        const autoAssignedOrg = await this.organizationsService.autoAssignUserByDomain(waitlistDto.email);
        if (autoAssignedOrg) {
          organizationId = autoAssignedOrg.id;
          organizationName = autoAssignedOrg.name;
          this.logger.log(`Auto-assigned waitlist user to organization based on email domain: ${autoAssignedOrg.name}`);
        }
      } catch (error) {
        this.logger.warn('Failed to auto-assign waitlist user by domain:', error);
      }
    }

    const query = `
      INSERT INTO users (
        email, password_hash, full_name, role, organization, organization_id, source, 
        signup_date, metadata, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      waitlistDto.email.toLowerCase(),
      hashedPassword,
      waitlistDto.full_name,
      waitlistDto.role,
      organizationName || null,
      organizationId,
      waitlistDto.source || 'auth_signup',
      new Date(),
      {
        signup_source: waitlistDto.source || 'auth_signup',
        signup_date: new Date().toISOString(),
        is_authenticated: true,
        ...waitlistDto.metadata,
      },
      true,
    ];

    const result = await this.databaseService.query(query, values);
    const user = result.rows[0];

    // If user joined an organization, log subscription information
    if (organizationId) {
      try {
        // Check if organization has an active subscription
        const orgStatusQuery = `
          SELECT 
            o.current_subscription_plan,
            o.current_subscription_status,
            os.plan_id as active_plan_id,
            os.status as active_status
          FROM organizations o
          LEFT JOIN organization_subscriptions os ON o.id = os.organization_id 
            AND os.status IN ('active', 'past_due')
          WHERE o.id = $1
        `;
        const orgStatusResult = await this.databaseService.query(orgStatusQuery, [organizationId]);
        
        if (orgStatusResult.rows.length > 0) {
          const orgStatus = orgStatusResult.rows[0];
          if (orgStatus.active_plan_id) {
            this.logger.log(`Waitlist user ${user.email} automatically gained access to organization's ${orgStatus.active_plan_id} subscription`);
          } else if (orgStatus.current_subscription_plan) {
            this.logger.log(`Waitlist user ${user.email} joined organization with ${orgStatus.current_subscription_plan} plan (status: ${orgStatus.current_subscription_status})`);
          }
        }
      } catch (error) {
        this.logger.warn('Failed to check organization subscription status for waitlist user:', error);
      }
    }

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organization_id: user.organization_id,
    };

    const token = this.jwtService.sign(payload);

    // Return success response (don't include password hash)
    const { password_hash, ...userResponse } = user;
    return {
      message: 'Successfully signed up!',
      token,
      user: userResponse,
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.databaseService.query(query, [email.toLowerCase()]);
    return result.rows[0] || null;
  }

  async validateUserById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1 AND is_active = true';
    const result = await this.databaseService.query(query, [id]);
    return result.rows[0] || null;
  }

  async getAllWaitlistUsers(): Promise<Partial<User>[]> {
    const query = `
      SELECT id, email, full_name, role, organization, created_at, updated_at
      FROM users 
      WHERE is_active = true 
      ORDER BY created_at DESC
    `;
    const result = await this.databaseService.query(query);
    return result.rows;
  }

  async getWaitlistStats(): Promise<{ total: number; byRole: Record<string, number> }> {
    // Get total count
    const totalQuery = 'SELECT COUNT(*) as total FROM users WHERE is_active = true';
    const totalResult = await this.databaseService.query(totalQuery);

    // Get count by role
    const roleQuery = `
      SELECT role, COUNT(*) as count 
      FROM users 
      WHERE is_active = true 
      GROUP BY role 
      ORDER BY count DESC
    `;
    const roleResult = await this.databaseService.query(roleQuery);

    const byRole: Record<string, number> = {};
    roleResult.rows.forEach((row) => {
      byRole[row.role] = parseInt(row.count);
    });

    return {
      total: parseInt(totalResult.rows[0].total),
      byRole,
    };
  }

  /**
   * Request password reset - generates secure token and sends email
   */
  async requestPasswordReset(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.getUserByEmail(forgotPasswordDto.email);
    
    // Always return success message for security (don't reveal if email exists)
    const successMessage = 'If an account with that email exists, you will receive a password reset email shortly.';
    
    if (!user || !user.is_active) {
      this.logger.warn(`Password reset requested for non-existent or inactive user: ${forgotPasswordDto.email}`);
      return { message: successMessage };
    }

    try {
      // Generate secure random token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Set expiration to 1 hour from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Clean up any existing tokens for this user (optional - for security)
      await this.databaseService.query(
        'UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false',
        [user.id]
      );

      // Store reset token in database
      const insertTokenQuery = `
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
      
      await this.databaseService.query(insertTokenQuery, [user.id, resetToken, expiresAt]);

      // Send password reset email
      await this.emailService.sendPasswordResetEmail(user.email, resetToken, user.full_name);

      this.logger.log(`Password reset token generated for user: ${user.email}`);
      
    } catch (error) {
      this.logger.error('Error generating password reset token:', error);
      // Still return success message for security
    }

    return { message: successMessage };
  }

  /**
   * Reset password using valid token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    // Find valid, unused token
    const tokenQuery = `
      SELECT prt.*, u.email, u.full_name, u.id as user_id
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token = $1 
        AND prt.used = false 
        AND prt.expires_at > CURRENT_TIMESTAMP
        AND u.is_active = true
    `;
    
    const tokenResult = await this.databaseService.query(tokenQuery, [resetPasswordDto.token]);
    
    if (tokenResult.rows.length === 0) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const tokenData = tokenResult.rows[0];

    try {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(resetPasswordDto.password, 10);

      // Update user's password
      const updatePasswordQuery = `
        UPDATE users 
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;
      
      await this.databaseService.query(updatePasswordQuery, [hashedPassword, tokenData.user_id]);

      // Mark token as used
      await this.databaseService.query(
        'UPDATE password_reset_tokens SET used = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [tokenData.id]
      );

      // Send confirmation email
      await this.emailService.sendPasswordChangedEmail(tokenData.email, tokenData.full_name);

      this.logger.log(`Password successfully reset for user: ${tokenData.email}`);

      return { message: 'Password has been successfully reset. You can now log in with your new password.' };
      
    } catch (error) {
      this.logger.error('Error resetting password:', error);
      throw new BadRequestException('Failed to reset password. Please try again.');
    }
  }

  /**
   * Validate reset token (useful for frontend to check if token is valid before showing reset form)
   */
  async validateResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    const tokenQuery = `
      SELECT u.email
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token = $1 
        AND prt.used = false 
        AND prt.expires_at > CURRENT_TIMESTAMP
        AND u.is_active = true
    `;
    
    const tokenResult = await this.databaseService.query(tokenQuery, [token]);
    
    if (tokenResult.rows.length === 0) {
      return { valid: false };
    }

    return { 
      valid: true, 
      email: tokenResult.rows[0].email 
    };
  }
} 