import { awsClientOptions } from '@app/common';
import { SQSClient } from '@aws-sdk/client-sqs';
import { Module } from '@nestjs/common';
import { PLAYER_NOTIFIER } from './application/player-notifier';
import { WalletEventHandler } from './application/wallet-event.handler';
import { PlayerTokenService } from './auth/player-token.service';
import {
  loadNotificationConfigWithSecrets,
  NOTIFICATION_CONFIG,
  NotificationConfig,
} from './config';
import { NotificationsQueueListener } from './infrastructure/notifications-queue.listener';
import { DevTokensController } from './presentation/dev-tokens.controller';
import { HealthController } from './presentation/health.controller';
import { NotificationsGateway } from './presentation/notifications.gateway';

@Module({
  controllers: [HealthController, DevTokensController],
  providers: [
    { provide: NOTIFICATION_CONFIG, useFactory: loadNotificationConfigWithSecrets },
    {
      provide: SQSClient,
      inject: [NOTIFICATION_CONFIG],
      useFactory: (c: NotificationConfig) => new SQSClient(awsClientOptions(c.aws)),
    },
    PlayerTokenService,
    NotificationsGateway,
    // O gateway é quem sabe entregar ao jogador: ele implementa a porta PlayerNotifier.
    { provide: PLAYER_NOTIFIER, useExisting: NotificationsGateway },
    WalletEventHandler,
    NotificationsQueueListener,
  ],
})
export class AppModule {}
