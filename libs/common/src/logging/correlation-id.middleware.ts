import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Logger } from 'pino';
import { CORRELATION_HEADER, runWithCorrelationId, sanitizeCorrelationId } from './correlation';

/**
 * Primeiro elo da rastreabilidade: cada requisição HTTP recebe um correlationId
 * (o enviado pelo cliente no header X-Correlation-Id ou um novo). Ele é devolvido
 * na resposta, aparece em todos os logs e segue dentro dos eventos publicados.
 */
export function correlationIdMiddleware(logger: Logger): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const correlationId = sanitizeCorrelationId(req.header(CORRELATION_HEADER));
    res.setHeader(CORRELATION_HEADER, correlationId);

    const startedAt = process.hrtime.bigint();
    res.on('finish', () => {
      // O healthcheck do Docker chama /health a cada poucos segundos: fica em debug.
      const level = req.path === '/health' ? 'debug' : 'info';
      logger[level](
        {
          correlationId,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: Number(process.hrtime.bigint() - startedAt) / 1e6,
        },
        'Requisição HTTP concluída',
      );
    });

    runWithCorrelationId(correlationId, next);
  };
}
