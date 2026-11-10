import { ApiProperty } from '@nestjs/swagger';
import { Transaction, TransactionType } from '../../domain/transaction.entity';
import { MoneyResponse } from './wallet.response';

export class TransactionResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) walletId!: string;
  @ApiProperty({ enum: TransactionType }) type!: TransactionType;
  @ApiProperty({ type: MoneyResponse }) amount!: MoneyResponse;
  @ApiProperty({ type: MoneyResponse }) balanceAfter!: MoneyResponse;
  @ApiProperty() idempotencyKey!: string;
  @ApiProperty() createdAt!: string;

  static from(t: Transaction): TransactionResponse {
    return {
      id: t.id,
      walletId: t.walletId,
      type: t.type,
      amount: { amountCents: t.amountCents, currency: t.currency },
      balanceAfter: { amountCents: t.balanceAfterCents, currency: t.currency },
      idempotencyKey: t.idempotencyKey,
      createdAt: t.createdAt.toISOString(),
    };
  }
}

export class TransactionPageResponse {
  @ApiProperty({ type: [TransactionResponse] }) items!: TransactionResponse[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
}
