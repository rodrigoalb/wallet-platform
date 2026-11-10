import 'reflect-metadata';
import { correlationIdMiddleware, createLogger, PinoNestLogger } from '@app/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WORKER_CONFIG, WorkerConfig } from './config';

/**
 * O worker não tem API pública: o HTTP existe só para o healthcheck.
 * O trabalho real acontece no consumidor da fila statements-queue.
 */
async function bootstrap(): Promise<void> {
  const logger = createLogger('statement-worker');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(new PinoNestLogger(logger));
  app.use(correlationIdMiddleware(logger));
  app.enableShutdownHooks();

  const config = app.get<WorkerConfig>(WORKER_CONFIG);
  await app.listen(config.port);
  logger.info(`statement-worker pronto (health na porta ${config.port})`);
}

void bootstrap();
