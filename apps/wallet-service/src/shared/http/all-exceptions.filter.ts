import { OptimisticLockError, UniqueConstraintViolationException } from '@mikro-orm/core';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  BusinessRuleError,
  ConflictError,
  DomainError,
  InvalidArgumentError,
  NotFoundError,
} from '../domain/errors';

/** Corpo de erro padronizado devolvido por todos os endpoints. */
export interface ErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

/**
 * Filtro global (equivalente a um @ControllerAdvice do Spring). Traduz erros
 * de domínio, de validação e de banco para respostas HTTP consistentes.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { status, error, message } = this.translate(exception);
    if (status >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    const body: ErrorBody = {
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };
    response.status(status).json(body);
  }

  private translate(exception: unknown): {
    status: number;
    error: string;
    message: string | string[];
  } {
    if (exception instanceof DomainError) {
      return {
        status: statusForDomainError(exception),
        error: exception.code,
        message: exception.message,
      };
    }
    if (exception instanceof OptimisticLockError) {
      return {
        status: HttpStatus.CONFLICT,
        error: 'CONCURRENT_MODIFICATION',
        message: 'A carteira foi alterada por outra operação. Tente novamente.',
      };
    }
    if (exception instanceof UniqueConstraintViolationException) {
      return { status: HttpStatus.CONFLICT, error: 'DUPLICATE', message: 'Registro duplicado' };
    }
    if (exception instanceof HttpException) {
      // Inclui os erros do ValidationPipe, cuja resposta traz a lista de mensagens.
      const res = exception.getResponse();
      const message =
        typeof res === 'object' && res !== null && 'message' in res
          ? (res as { message: string | string[] }).message
          : exception.message;
      return {
        status: exception.getStatus(),
        error: httpErrorCode(exception.getStatus()),
        message,
      };
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'INTERNAL_ERROR',
      message: 'Erro interno inesperado',
    };
  }
}

function statusForDomainError(error: DomainError): number {
  if (error instanceof InvalidArgumentError) return HttpStatus.BAD_REQUEST;
  if (error instanceof NotFoundError) return HttpStatus.NOT_FOUND;
  if (error instanceof ConflictError) return HttpStatus.CONFLICT;
  if (error instanceof BusinessRuleError) return HttpStatus.UNPROCESSABLE_ENTITY;
  return HttpStatus.BAD_REQUEST;
}

function httpErrorCode(status: number): string {
  switch (status) {
    case 400:
      return 'VALIDATION_ERROR';
    case 404:
      return 'NOT_FOUND';
    default:
      return HttpStatus[status] ?? 'HTTP_ERROR';
  }
}
