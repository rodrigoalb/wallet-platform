import { HeadObjectCommand, NotFound, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import { StatementFileStore } from '../application/ports';
import { WORKER_CONFIG, WorkerConfig } from '../config';

@Injectable()
export class S3StatementFileStore implements StatementFileStore {
  constructor(
    private readonly s3: S3Client,
    @Inject(WORKER_CONFIG) private readonly config: WorkerConfig,
  ) {}

  async exists(key: string): Promise<boolean> {
    try {
      await this.s3.send(new HeadObjectCommand({ Bucket: this.config.bucket, Key: key }));
      return true;
    } catch (error) {
      if (error instanceof NotFound) return false;
      throw error;
    }
  }

  async put(key: string, csv: string): Promise<void> {
    // PutObject é atômico: ou o arquivo inteiro aparece, ou nada aparece.
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: csv,
        ContentType: 'text/csv; charset=utf-8',
        ContentDisposition: 'attachment; filename="extrato.csv"',
      }),
    );
  }
}
