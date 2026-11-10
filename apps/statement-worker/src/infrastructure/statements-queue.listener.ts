import { createLogger, SqsConsumer } from '@app/common';
import { SQSClient } from '@aws-sdk/client-sqs';
import { Inject, Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { GenerateStatementHandler } from '../application/generate-statement.handler';
import { WORKER_CONFIG, WorkerConfig } from '../config';

/** Liga o consumidor SQS ao ciclo de vida do Nest (inicia no boot, para no shutdown). */
@Injectable()
export class StatementsQueueListener implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly consumer: SqsConsumer;

  constructor(
    sqs: SQSClient,
    handler: GenerateStatementHandler,
    @Inject(WORKER_CONFIG) config: WorkerConfig,
  ) {
    this.consumer = new SqsConsumer({
      client: sqs,
      queueUrl: config.queueUrl,
      logger: createLogger('statement-worker').child({ context: 'StatementsQueue' }),
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
