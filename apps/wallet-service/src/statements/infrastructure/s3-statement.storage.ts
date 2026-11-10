import { GetObjectCommand, HeadObjectCommand, NotFound, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';
import { WALLET_CONFIG, WalletServiceConfig } from '../../config/wallet-config';
import { PRESIGNING_S3_CLIENT } from '../../shared/infrastructure/aws.providers';
import { StatementStorage } from '../application/statement-storage';

@Injectable()
export class S3StatementStorage implements StatementStorage {
  constructor(
    private readonly s3: S3Client,
    @Inject(PRESIGNING_S3_CLIENT) private readonly presigner: S3Client,
    @Inject(WALLET_CONFIG) private readonly config: WalletServiceConfig,
  ) {}

  async exists(objectKey: string): Promise<boolean> {
    try {
      await this.s3.send(
        new HeadObjectCommand({ Bucket: this.config.statementsBucket, Key: objectKey }),
      );
      return true;
    } catch (error) {
      if (error instanceof NotFound) return false;
      throw error;
    }
  }

  createDownloadUrl(objectKey: string, ttlSeconds: number): Promise<string> {
    // A assinatura é calculada localmente (sem chamada de rede) e expira em ttlSeconds.
    return getSignedUrl(
      this.presigner,
      new GetObjectCommand({ Bucket: this.config.statementsBucket, Key: objectKey }),
      { expiresIn: ttlSeconds },
    );
  }
}
