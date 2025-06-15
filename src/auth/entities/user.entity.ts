export interface User {
  id: string;
  email: string;
  password_hash?: string;
  full_name: string;
  role: string;
  organization?: string;
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
  organization?: string;
  metadata?: Record<string, any>;
}

export interface WaitlistSignupRequest {
  email: string;
  full_name: string;
  role?: string;
  organization?: string;
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
  iat?: number;
  exp?: number;
} 