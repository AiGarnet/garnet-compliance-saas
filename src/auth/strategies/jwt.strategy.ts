import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger: Logger;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    // Get JWT secret directly from environment variable first, then from config
    const jwtSecret = process.env.JWT_SECRET || configService.get<string>('jwt.secret');
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined! Authentication will fail.');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
    
    // Initialize logger after super() call
    this.logger = new Logger(JwtStrategy.name);
    this.logger.log('JWT Strategy initialized with secret');
  }

  async validate(payload: JwtPayload) {
    try {
      const user = await this.authService.validateUserById(payload.sub);
      if (!user) {
        this.logger.warn(`User with ID ${payload.sub} not found during JWT validation`);
        throw new UnauthorizedException('User not found');
      }
      return user;
    } catch (error) {
      this.logger.error(`JWT validation error: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
} 