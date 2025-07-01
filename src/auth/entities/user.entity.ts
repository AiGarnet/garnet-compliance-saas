import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  full_name: string;
  role: string;
  organization_id?: string; // New field for organization link
  organization?: string; // Legacy field for backwards compatibility
  metadata?: Record<string, any>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  source?: string;
  signup_date?: Date;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  role: string;
  organization_id?: string; // New field for organization link
  organization?: string; // Legacy field for backwards compatibility
  metadata?: Record<string, any>;
}

export interface WaitlistSignupRequest {
  email: string;
  full_name: string;
  role?: string;
  organization_id?: string; // New field for organization link
  organization?: string; // Legacy field for backwards compatibility
  password?: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  organization_id?: string; // Include organization in JWT for quick access
  iat?: number;
  exp?: number;
}

// TypeORM Entity for users table
@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column()
  role: string;

  @Column({ name: 'organization_id', nullable: true })
  organizationId: string;

  @Column({ nullable: true })
  organization: string; // Legacy field

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ nullable: true })
  source: string;

  @Column({ name: 'signup_date', nullable: true })
  signupDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne('Organization', 'users')
  @JoinColumn({ name: 'organization_id' })
  organizationEntity: any;

  // Convert to interface format
  toUser(): User {
    return {
      id: this.id,
      email: this.email,
      password_hash: this.passwordHash,
      full_name: this.fullName,
      role: this.role,
      organization_id: this.organizationId,
      organization: this.organization,
      metadata: this.metadata,
      is_active: this.isActive,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      source: this.source,
      signup_date: this.signupDate
    };
  }
} 