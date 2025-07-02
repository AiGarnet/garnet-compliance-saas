import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';
import { User, CreateUserRequest, WaitlistSignupRequest, JwtPayload } from './entities/user.entity';
import { SignupDto, LoginDto, WaitlistSignupDto } from './dto/auth.dto';
import { OrganizationsService } from '../organizations/organizations.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async signup(signupDto: SignupDto): Promise<{ access_token: string; user: Partial<User> }> {
    const existingUser = await this.getUserByEmail(signupDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(signupDto.password, 10);
    
    let organizationId: string | null = null;
    let organizationName = signupDto.organization;

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
        }
      } catch (error) {
        console.error('Error handling organization during signup:', error);
        // Continue without organization if there's an error
        organizationId = null;
      }
    }

    const query = `
      INSERT INTO users (email, password_hash, full_name, role, organization, organization_id, metadata, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, full_name, role, organization, organization_id, created_at, updated_at
    `;

    const values = [
      signupDto.email.toLowerCase(),
      hashedPassword,
      signupDto.full_name,
      signupDto.role,
      organizationName || null, // Keep legacy field for backwards compatibility
      organizationId, // New organization_id field
      signupDto.metadata || {},
      true,
    ];

    const result = await this.databaseService.query(query, values);
    const user = result.rows[0];

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
        }
      } catch (error) {
        console.error('Error handling organization during waitlist signup:', error);
        // Continue without organization if there's an error
        organizationId = null;
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
} 