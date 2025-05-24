/**
 * Environment variables configuration
 */

// Database configuration
export const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'garnet_ai',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Sonasuhani1',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

// JWT configuration
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-key-change-this-in-production';
export const JWT_EXPIRY = '7d';

// API configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'; 