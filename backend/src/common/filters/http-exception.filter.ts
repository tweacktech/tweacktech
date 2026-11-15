import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

const DATABASE_DOWN_CODES = new Set([
  'P1000', // authentication failed
  'P1001', // can't reach database server
  'P1002', // database timeout
  'P1008', // operation timed out
  'P1010', // access denied
  'P1017', // server closed the connection
  'P2024', // pool timeout
]);

const isDatabaseOffline = (exception: unknown): boolean => {
  if (exception instanceof Prisma.PrismaClientInitializationError) return true;
  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    return DATABASE_DOWN_CODES.has(exception.code);
  }
  const message =
    exception instanceof Error ? exception.message.toLowerCase() : '';
  return (
    message.includes("can't reach database server") ||
    message.includes('could not connect to the database') ||
    message.includes('connection refused') ||
    message.includes('econnrefused') ||
    message.includes('etimedout') ||
    message.includes('connection pool') ||
    message.includes('prisma client could not')
  );
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Database outages are operational, not application errors. Return a
    // consistent, friendly payload the UI can render as an offline banner.
    if (isDatabaseOffline(exception)) {
      this.logger.warn(
        `Database unavailable for ${request.method} ${request.url}`,
      );
      response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        code: 'DATABASE_OFFLINE',
        service: 'database',
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        message:
          'TweackTech is having network trouble right now. Your data is safe — please try again in a moment.',
        errors: null,
      });
      return;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong on our side. Please try again.';
    let errors: any = null;
    let code: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();
      if (typeof responseBody === 'string') {
        message = responseBody;
      } else {
        const body = responseBody as any;
        message = Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message || exception.message;
        errors = body.errors || null;
        code = body.code;
      }
    } else if (exception instanceof Error) {
      // Do not leak driver/SQL internals to the browser.
      this.logger.error(exception.stack);
      if (process.env.NODE_ENV !== 'production') {
        message = exception.message;
      }
    }

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
    );

    response.status(status).json({
      statusCode: status,
      code,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      errors,
    });
  }
}
