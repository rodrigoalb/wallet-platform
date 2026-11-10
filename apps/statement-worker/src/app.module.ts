import { awsClientOptions } from '@app/common';
import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';
import { Module } from '@nestjs/common';
import { GenerateStatementHandler } from './application/generate-statement.handler';
import { LEDGER_SOURCE, STATEMENT_FILE_STORE } from './application/ports';
import { loadWorkerConfig, WORKER_CONFIG, WorkerConfig } from './config';
import { HealthController } from './health.controller';
import { S3StatementFileStore } from './infrastructure/s3-statement-file.store';
import { StatementsQueueListener } from './infrastructure/statements-queue.listener';
import { WalletApiLedgerSource } from './infrastructure/wallet-api.ledger-source';

@Module({
  controllers: [HealthController],
  providers: [
    { provide: WORKER_CONFIG, useFactory: () => loadWorkerConfig() },
    {
      provide: SQSClient,
      inject: [WORKER_CONFIG],
      useFactory: (c: WorkerConfig) => new SQSClient(awsClientOptions(c.aws)),
    },
    {
      provide: S3Client,
      inject: [WORKER_CONFIG],
      useFactory: (c: WorkerConfig) => new S3Client(awsClientOptions(c.aws)),
    },
    { provide: LEDGER_SOURCE, useClass: WalletApiLedgerSource },
    { provide: STATEMENT_FILE_STORE, useClass: S3StatementFileStore },
    GenerateStatementHandler,
    StatementsQueueListener,
  ],
})
export class AppModule {}
