import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request) {
      return next.handle();
    }

    const { method, url } = request;
    const tenantId = (request as any)?.tenantId;
    const userId = (request as any)?.userId;
    const start = Date.now();

    this.logger.log({
      message: 'Incoming request',
      method,
      url,
      tenantId,
      userId,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log({
            message: 'Outgoing response',
            method,
            url,
            tenantId,
            userId,
            durationMs: Date.now() - start,
            statusCode: context.switchToHttp().getResponse().statusCode,
          });
        },
        error: () => {
          this.logger.warn({
            message: 'Request failed',
            method,
            url,
            tenantId,
            userId,
            durationMs: Date.now() - start,
          });
        },
      }),
    );
  }
}
