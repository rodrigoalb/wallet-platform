import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { WALLET_CONFIG, WalletServiceConfig } from './config/wallet-config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  const config = app.get<WalletServiceConfig>(WALLET_CONFIG);
  await app.listen(config.port);
}

void bootstrap();
