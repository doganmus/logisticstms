import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  LoggerService,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;
  message: string | unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>() as Request & {
      id?: string;
    };

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorBody: ErrorResponseBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.headers['x-request-id'] as string | undefined ?? request.id,
      message:
        exception instanceof HttpException
          ? exception.getResponse()
          : 'Internal server error',
    };

    this.logger.error({
      message: 'Unhandled exception',
      ...errorBody,
      tenantId: (request as any)?.tenantId,
      userId: (request as any)?.userId,
      stack:
        exception instanceof Error && process.env.NODE_ENV !== 'production'
          ? exception.stack
          : undefined,
    });

    response.status(status).json(errorBody);
  }
}
