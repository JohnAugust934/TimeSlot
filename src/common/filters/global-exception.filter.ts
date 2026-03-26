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

interface NormalizedError {
  message: string;
  code: string;
  details: string[];
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ url?: string }>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const normalizedError = this.normalizeHttpException(
        exceptionResponse,
        exception.message,
        status,
      );

      response.status(status).json({
        success: false,
        error: normalizedError,
        path: request.url ?? null,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const status = this.getPrismaStatus(exception.code);
      response.status(status).json({
        success: false,
        error: {
          message: this.getPrismaMessage(exception.code),
          code: `DB_${exception.code}`,
          details: [],
        },
        path: request.url ?? null,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    this.logger.error(exception);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        message: 'Erro interno inesperado.',
        code: 'INTERNAL_SERVER_ERROR',
        details: [],
      },
      path: request.url ?? null,
      timestamp: new Date().toISOString(),
    });
  }

  private normalizeHttpException(
    exceptionResponse: string | object,
    fallbackMessage: string,
    status: number,
  ): NormalizedError {
    const defaultCode = this.getHttpCode(status);

    if (typeof exceptionResponse === 'string') {
      return {
        message: exceptionResponse,
        code: defaultCode,
        details: [],
      };
    }

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const candidate = exceptionResponse as {
        message?: string | string[];
        error?: string;
        code?: string;
      };

      if (Array.isArray(candidate.message)) {
        return {
          message: 'Falha de validacao.',
          code: candidate.code ?? 'VALIDATION_ERROR',
          details: candidate.message,
        };
      }

      return {
        message: candidate.message ?? candidate.error ?? fallbackMessage,
        code: candidate.code ?? defaultCode,
        details: [],
      };
    }

    return {
      message: fallbackMessage,
      code: defaultCode,
      details: [],
    };
  }

  private getHttpCode(status: number): string {
    const codeByStatus: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
    };

    return codeByStatus[status] ?? 'HTTP_ERROR';
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
        return 'Ja existe um registro com valor unico informado.';
      case 'P2025':
        return 'Registro solicitado nao foi encontrado.';
      default:
        return 'Falha na operacao de banco de dados.';
    }
  }
}
