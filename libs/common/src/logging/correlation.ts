import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

/**
 * Guarda o correlationId da operação atual sem precisar passá-lo de função em
 * função. O AsyncLocalStorage acompanha a cadeia de promises, parecido com um
 * ThreadLocal/MDC do Java, mas para código assíncrono.
 */
const storage = new AsyncLocalStorage<{ correlationId: string }>();

export const CORRELATION_HEADER = 'x-correlation-id';

export function runWithCorrelationId<T>(correlationId: string, fn: () => T): T {
  return storage.run({ correlationId }, fn);
}

export function getCorrelationId(): string | undefined {
  return storage.getStore()?.correlationId;
}

/** Aceita o id recebido se ele for razoável; caso contrário gera um novo. */
export function sanitizeCorrelationId(value: unknown): string {
  return typeof value === 'string' && /^[A-Za-z0-9._:-]{1,100}$/.test(value) ? value : randomUUID();
}
