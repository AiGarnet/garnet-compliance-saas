import { Injectable, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { WaitlistEntry, CreateWaitlistEntryRequest } from './entities/waitlist.entity';
import { JoinWaitlistDto } from './dto/waitlist.dto';

@Injectable()
export class WaitlistService {
  constructor(private readonly databaseService: DatabaseService) {}

  async addToWaitlist(entryData: JoinWaitlistDto): Promise<WaitlistEntry> {
    try {
      const query = `
        INSERT INTO waitlist (name, email, role, organization)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const values = [
        entryData.full_name, // Note: using full_name from DTO but storing as 'name' in DB
        entryData.email.toLowerCase(),
        entryData.role || null,
        entryData.organization || null,
      ];

      const result = await this.databaseService.query(query, values);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new ConflictException('Email already exists in waitlist');
      }
      throw error;
    }
  }

  async getWaitlistByEmail(email: string): Promise<WaitlistEntry | null> {
    const query = 'SELECT * FROM waitlist WHERE email = $1';
    const result = await this.databaseService.query(query, [email.toLowerCase()]);
    return result.rows[0] || null;
  }

  async getAllWaitlistEntries(): Promise<WaitlistEntry[]> {
    const query = `
      SELECT * FROM waitlist 
      ORDER BY created_at DESC
    `;
    const result = await this.databaseService.query(query);
    return result.rows;
  }

  async getWaitlistStats(): Promise<{ total: number; byRole: Record<string, number> }> {
    // Get total count
    const totalQuery = 'SELECT COUNT(*) as total FROM waitlist';
    const totalResult = await this.databaseService.query(totalQuery);

    // Get count by role
    const roleQuery = `
      SELECT role, COUNT(*) as count 
      FROM waitlist 
      WHERE role IS NOT NULL
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

  async deleteWaitlistEntry(id: string): Promise<boolean> {
    const query = 'DELETE FROM waitlist WHERE id = $1';
    const result = await this.databaseService.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
} 