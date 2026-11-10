import { createLogger, SqsConsumer } from '@app/common';
import { SQSClient } from '@aws-sdk/client-sqs';
import { Inject, Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { WalletEventHandler } from '../application/wallet-event.handler';
import { NOTIFICATION_CONFIG, NotificationConfig } from '../config';

@Injectable()
export class NotificationsQueueListener implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly consumer: SqsConsumer;

  constructor(
    sqs: SQSClient,
    handler: WalletEventHandler,
    @Inject(NOTIFICATION_CONFIG) config: NotificationConfig,
  ) {
    this.consumer = new SqsConsumer({
      client: sqs,
      queueUrl: config.queueUrl,
      logger: createLogger('notification-service').child({ context: 'NotificationsQueue' }),
      handle: (event) => handler.handle(event),
    });
  }

  get running(): boolean {
    return this.consumer.isRunning;
  }

  onApplicationBootstrap(): void {
    this.consumer.start();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.consumer.stop();
  }
}
