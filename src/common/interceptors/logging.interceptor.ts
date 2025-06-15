import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip } = request;
    const userAgent = request.get('User-Agent') || '';
    const now = Date.now();

    // Log incoming request
    this.logger.log(
      `📝 ${new Date().toISOString()} - ${method} ${url} - IP: ${ip} - UserAgent: ${userAgent}`,
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - now;
          this.logger.log(
            `✅ ${method} ${url} - ${responseTime}ms - Success`,
          );
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          this.logger.error(
            `❌ ${method} ${url} - ${responseTime}ms - Error: ${error.message}`,
          );
        },
      }),
    );
  }
} 