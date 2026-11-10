import { AwsConfig, intEnv, optionalEnv, readAwsConfigFromEnv } from '@app/common';

export interface WorkerConfig {
  port: number;
  aws: AwsConfig;
  queueUrl: string;
  bucket: string;
  walletServiceUrl: string;
}

export const WORKER_CONFIG = Symbol('WORKER_CONFIG');

export function loadWorkerConfig(): WorkerConfig {
  return {
    port: intEnv('PORT', 3002),
    aws: readAwsConfigFromEnv(),
    queueUrl: optionalEnv(
      'STATEMENTS_QUEUE_URL',
      'http://localhost:4566/000000000000/statements-queue',
    ),
    bucket: optionalEnv('STATEMENTS_BUCKET', 'wallet-statements'),
    walletServiceUrl: optionalEnv('WALLET_SERVICE_URL', 'http://localhost:3000'),
  };
}
