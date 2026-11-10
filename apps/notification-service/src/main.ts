import 'reflect-metadata';
import { correlationIdMiddleware, createLogger, PinoNestLogger } from '@app/common';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { NOTIFICATION_CONFIG, NotificationConfig } from './config';

async function bootstrap(): Promise<void> {
  const logger = createLogger('notification-service');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(new PinoNestLogger(logger));
  app.use(correlationIdMiddleware(logger));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.enableShutdownHooks();

  const config = app.get<NotificationConfig>(NOTIFICATION_CONFIG);
  // Página de demonstração em http://localhost:3001/
  app.useStaticAssets(config.publicDir);

  await app.listen(config.port);
  logger.info(`notification-service ouvindo na porta ${config.port} (HTTP e WebSocket)`);
}

void bootstrap();
