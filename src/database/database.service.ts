import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class DatabaseService {
  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,
    private readonly configService: ConfigService,
  ) {}

  async getConnection(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  async query(text: string, params?: any[]): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  async getHealthStatus() {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time');
      client.release();
      
      return {
        status: 'healthy',
        database: 'connected',
        timestamp: result.rows[0].current_time,
        url: this.configService.get('database.url')?.replace(/:[^:@]*@/, ':***@'), // Hide password
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
      };
    }
  }

  async closePool(): Promise<void> {
    await this.pool.end();
  }
} 