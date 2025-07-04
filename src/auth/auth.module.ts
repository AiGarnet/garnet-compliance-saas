import { Module, Logger } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController, AuthWaitlistController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { DatabaseModule } from '../database/database.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
    DatabaseModule,
    OrganizationsModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('JwtModule');
        
        // Get JWT secret directly from environment variable first, then from config
        const jwtSecret = process.env.JWT_SECRET || configService.get<string>('jwt.secret');
        
        if (!jwtSecret) {
          logger.error('JWT_SECRET is not defined! Authentication will fail.');
          throw new Error('JWT_SECRET environment variable is required');
        }
        
        logger.log('JWT Module initialized with secret');
        
        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: process.env.JWT_EXPIRES_IN || configService.get<string>('jwt.expiresIn') || '24h',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, AuthWaitlistController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {} 