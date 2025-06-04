import pool from '../config/database';

export interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  role?: string;
  organization?: string;
  created_at: Date;
}

export interface CreateWaitlistEntryRequest {
  name: string;
  email: string;
  role?: string;
  organization?: string;
}

export class WaitlistService {
  async addToWaitlist(entryData: CreateWaitlistEntryRequest): Promise<WaitlistEntry> {
    const client = await pool.connect();
    
    try {
      const query = `
        INSERT INTO waitlist (name, email, role, organization)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const values = [
        entryData.name,
        entryData.email.toLowerCase(),
        entryData.role || null,
        entryData.organization || null
      ];
      
      const result = await client.query(query, values);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Email already exists in waitlist');
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async getWaitlistByEmail(email: string): Promise<WaitlistEntry | null> {
    const client = await pool.connect();
    
    try {
      const query = 'SELECT * FROM waitlist WHERE email = $1';
      const result = await client.query(query, [email.toLowerCase()]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async getAllWaitlistEntries(): Promise<WaitlistEntry[]> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT * FROM waitlist 
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
      const totalQuery = 'SELECT COUNT(*) as total FROM waitlist';
      const totalResult = await client.query(totalQuery);
      
      // Get count by role
      const roleQuery = `
        SELECT role, COUNT(*) as count 
        FROM waitlist 
        WHERE role IS NOT NULL
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

  async deleteWaitlistEntry(id: string): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      const query = 'DELETE FROM waitlist WHERE id = $1';
      const result = await client.query(query, [id]);
      return (result.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  }
} 