import { awsClientOptions } from '@app/common';
import { S3Client } from '@aws-sdk/client-s3';
import { SNSClient } from '@aws-sdk/client-sns';
import { Provider } from '@nestjs/common';
import { WALLET_CONFIG, WalletServiceConfig } from '../../config/wallet-config';

/** Cliente S3 configurado com o endpoint público, usado só para assinar URLs. */
export const PRESIGNING_S3_CLIENT = Symbol('PRESIGNING_S3_CLIENT');

export const awsProviders: Provider[] = [
  {
    provide: SNSClient,
    inject: [WALLET_CONFIG],
    useFactory: (config: WalletServiceConfig) => new SNSClient(awsClientOptions(config.aws)),
  },
  {
    provide: S3Client,
    inject: [WALLET_CONFIG],
    useFactory: (config: WalletServiceConfig) => new S3Client(awsClientOptions(config.aws)),
  },
  {
    provide: PRESIGNING_S3_CLIENT,
    inject: [WALLET_CONFIG],
    useFactory: (config: WalletServiceConfig) =>
      new S3Client(awsClientOptions(config.aws, config.aws.publicEndpoint)),
  },
];
