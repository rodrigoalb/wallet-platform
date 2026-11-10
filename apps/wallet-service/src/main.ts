import 'reflect-metadata';
import { createLogger, PinoNestLogger } from '@app/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { WALLET_CONFIG, WalletServiceConfig } from './config/wallet-config';

async function bootstrap(): Promise<void> {
  const logger = createLogger('wallet-service');
  // bufferLogs segura os logs do início até o logger pino ser instalado.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(new PinoNestLogger(logger));
  configureApp(app, logger);

  const config = app.get<WalletServiceConfig>(WALLET_CONFIG);
  await app.listen(config.port);
  logger.info(`wallet-service ouvindo na porta ${config.port}`);
}

void bootstrap();
