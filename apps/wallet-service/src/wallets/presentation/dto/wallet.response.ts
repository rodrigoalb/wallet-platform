import { ApiProperty } from '@nestjs/swagger';
import { Wallet } from '../../domain/wallet.entity';

export class MoneyResponse {
  @ApiProperty({ example: 1050, description: 'Valor em centavos (inteiro)' })
  amountCents!: number;

  @ApiProperty({ example: 'BRL' })
  currency!: string;
}

export class WalletResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) playerId!: string;
  @ApiProperty({ type: MoneyResponse }) balance!: MoneyResponse;
  @ApiProperty() createdAt!: string;

  static from(wallet: Wallet): WalletResponse {
    return {
      id: wallet.id,
      playerId: wallet.playerId,
      balance: { amountCents: wallet.balanceInCents, currency: wallet.currency },
      createdAt: wallet.createdAt.toISOString(),
    };
  }
}
