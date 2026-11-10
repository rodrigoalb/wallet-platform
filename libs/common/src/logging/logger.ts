import { LoggerService } from '@nestjs/common';
import pino, { Logger } from 'pino';
import { getCorrelationId } from './correlation';

/**
 * Logger JSON (uma linha por evento), fácil de filtrar em ferramentas como
 * CloudWatch ou Loki. Todo log inclui o nome do serviço e, quando existir,
 * o correlationId da operação em andamento.
 */
export function createLogger(service: string): Logger {
  return pino({
    level: process.env.LOG_LEVEL ?? 'info',
    base: { service },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: { level: (label) => ({ level: label }) },
    mixin: () => {
      const correlationId = getCorrelationId();
      return correlationId ? { correlationId } : {};
    },
  });
}

/**
 * Adaptador para o Nest usar o pino. Assim, `new Logger('Contexto')` do
 * @nestjs/common (usado nas classes) também sai em JSON com correlationId.
 */
export class PinoNestLogger implements LoggerService {
  constructor(private readonly logger: Logger) {}

  log(message: unknown, context?: string): void {
    this.logger.info({ context }, stringify(message));
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.logger.error({ context, trace }, stringify(message));
  }

  warn(message: unknown, context?: string): void {
    this.logger.warn({ context }, stringify(message));
  }

  debug(message: unknown, context?: string): void {
    this.logger.debug({ context }, stringify(message));
  }

  verbose(message: unknown, context?: string): void {
    this.logger.trace({ context }, stringify(message));
  }
}

function stringify(message: unknown): string {
  return typeof message === 'string' ? message : JSON.stringify(message);
}
