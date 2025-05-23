import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { User, CreateUserRequest } from '../types/user';

export class UserService {
  async createUser(userData: CreateUserRequest): Promise<User> {
    const client = await pool.connect();
    
    try {
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      
      // Insert user into database
      const query = `
        INSERT INTO users (email, password_hash, full_name, role, organization, metadata, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        userData.email.toLowerCase(),
        hashedPassword,
        userData.full_name,
        userData.role,
        userData.organization || null,
        userData.metadata || {},
        true // is_active default to true for waitlist users
      ];
      
      const result = await client.query(query, values);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('User with this email already exists');
      }
      throw error;
    } finally {
      client.release();
    }
  }
  
  async getUserByEmail(email: string): Promise<User | null> {
    const client = await pool.connect();
    
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await client.query(query, [email.toLowerCase()]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
  
  async getUserById(id: string): Promise<User | null> {
    const client = await pool.connect();
    
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
  
  async getAllWaitlistUsers(): Promise<User[]> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT id, email, full_name, role, organization, created_at, updated_at
        FROM users 
        WHERE is_active = true 
        ORDER BY created_at DESC
      `;
      const result = await client.query(query);
      return result.rows;
    } finally {
      client.release();
    }
  }
  
  async getWaitlistStats(): Promise<{ total: number; byRole: Record<string, number> }> {
    const client = await pool.connect();
    
    try {
      // Get total count
      const totalQuery = 'SELECT COUNT(*) as total FROM users WHERE is_active = true';
      const totalResult = await client.query(totalQuery);
      
      // Get count by role
      const roleQuery = `
        SELECT role, COUNT(*) as count 
        FROM users 
        WHERE is_active = true 
        GROUP BY role 
        ORDER BY count DESC
      `;
      const roleResult = await client.query(roleQuery);
      
      const byRole: Record<string, number> = {};
      roleResult.rows.forEach(row => {
        byRole[row.role] = parseInt(row.count);
      });
      
      return {
        total: parseInt(totalResult.rows[0].total),
        byRole
      };
    } finally {
      client.release();
    }
  }
} 