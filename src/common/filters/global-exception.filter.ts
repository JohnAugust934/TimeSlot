import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const normalizedError = this.normalizeHttpException(exceptionResponse, exception.message);

      response.status(status).json({
        success: false,
        error: normalizedError,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      response.status(this.getPrismaStatus(exception.code)).json({
        success: false,
        error: {
          message: this.getPrismaMessage(exception.code),
          code: exception.code,
          details: [],
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    this.logger.error(exception);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        message: 'Unexpected internal server error.',
        details: [],
      },
      timestamp: new Date().toISOString(),
    });
  }

  private normalizeHttpException(exceptionResponse: string | object, fallbackMessage: string) {
    if (typeof exceptionResponse === 'string') {
      return {
        message: exceptionResponse,
        details: [],
      };
    }

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const candidate = exceptionResponse as {
        message?: string | string[];
        error?: string;
      };

      if (Array.isArray(candidate.message)) {
        return {
          message: 'Validation failed.',
          details: candidate.message,
        };
      }

      return {
        message: candidate.message ?? candidate.error ?? fallbackMessage,
        details: [],
      };
    }

    return {
      message: fallbackMessage,
      details: [],
    };
  }

  private getPrismaStatus(code: string): number {
    switch (code) {
      case 'P2002':
        return HttpStatus.CONFLICT;
      case 'P2025':
        return HttpStatus.NOT_FOUND;
      default:
        return HttpStatus.BAD_REQUEST;
    }
  }

  private getPrismaMessage(code: string): string {
    switch (code) {
      case 'P2002':
        return 'A unique field already exists with the provided value.';
      case 'P2025':
        return 'Requested record was not found.';
      default:
        return 'Database request failed.';
    }
  }
}
