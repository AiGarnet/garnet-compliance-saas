import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pool } from 'pg';
import { DatabaseService } from './database.service';

// Import all entities that need TypeORM
import { Activity } from '../activities/entities/activity.entity';

@Global()
@Module({
  imports: [
    ConfigModule,
    // TypeORM configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('database.url'),
        ssl: configService.get<boolean>('database.ssl') 
          ? { rejectUnauthorized: false } 
          : false,
        entities: [Activity], // Add entities here as they are created
        synchronize: false, // Set to false in production, use migrations instead
        logging: configService.get<string>('nodeEnv') === 'development',
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: 'DATABASE_POOL',
      useFactory: async (configService: ConfigService) => {
        const connectionString = configService.get<string>('database.url');
        
        const pool = new Pool({
          connectionString,
          ssl: configService.get<boolean>('database.ssl') 
            ? { rejectUnauthorized: false } 
            : false,
        });

        // Log database connection status
        pool.on('connect', () => {
          console.log('✅ Connected to PostgreSQL database');
        });

        pool.on('error', (err) => {
          console.error('❌ Unexpected error on idle client', err);
        });

        // Test the connection
        try {
          const client = await pool.connect();
          console.log('🔗 Database connection test successful');
          client.release();
        } catch (error) {
          console.error('❌ Database connection test failed:', error);
        }

        return pool;
      },
      inject: [ConfigService],
    },
    DatabaseService,
  ],
  exports: ['DATABASE_POOL', DatabaseService],
})
export class DatabaseModule {} 