import { Injectable, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Log the authentication attempt
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const hasToken = !!authHeader;
    const path = request.path;
    const method = request.method;

    this.logger.log(`🔒 Auth check for ${method} ${path} - Token present: ${hasToken}`);
    
    // Call the parent canActivate but add logging
    return super.canActivate(context).pipe(
      tap(result => {
        this.logger.log(`✅ Authentication successful for ${method} ${path}`);
      }),
      catchError(error => {
        // Log detailed error information
        this.logger.error(`❌ Authentication failed for ${method} ${path} - ${error.message}`);
        
        // Log token debugging information (safely)
        if (hasToken) {
          try {
            // Extract just the token type for debugging
            const tokenType = authHeader.split(' ')[0];
            this.logger.error(`Token type: ${tokenType}, expected: Bearer`);
            
            // Check if token format is correct
            if (!authHeader.startsWith('Bearer ')) {
              throw new UnauthorizedException('Invalid token format. Use "Bearer <token>"');
            }
            
            // Check token length
            const token = authHeader.split(' ')[1];
            if (!token || token.length < 10) {
              throw new UnauthorizedException('Invalid token length');
            }
          } catch (tokenError) {
            this.logger.error(`Token parsing error: ${tokenError.message}`);
          }
        } else {
          this.logger.error('No Authorization header present');
        }
        
        throw error;
      })
    );
  }
} 