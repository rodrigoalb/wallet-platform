import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatementStatus } from '../../domain/statement.entity';
import { StatementView } from '../../application/get-statement.use-case';

export class StatementResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) walletId!: string;
  @ApiProperty({ enum: StatementStatus }) status!: StatementStatus;
  @ApiProperty() from!: string;
  @ApiProperty() to!: string;
  @ApiProperty() createdAt!: string;

  @ApiPropertyOptional({ description: 'URL pré-assinada do S3 (presente quando READY)' })
  downloadUrl?: string;

  @ApiPropertyOptional({ description: 'Momento em que a URL deixa de funcionar' })
  downloadUrlExpiresAt?: string;

  static from({ statement, download }: StatementView): StatementResponse {
    return {
      id: statement.id,
      walletId: statement.walletId,
      status: statement.status,
      from: statement.periodFrom.toISOString(),
      to: statement.periodTo.toISOString(),
      createdAt: statement.createdAt.toISOString(),
      ...(download && {
        downloadUrl: download.url,
        downloadUrlExpiresAt: download.expiresAt.toISOString(),
      }),
    };
  }
}
