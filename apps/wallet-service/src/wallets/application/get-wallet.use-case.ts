import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../shared/domain/errors';
import { Wallet } from '../domain/wallet.entity';
import { WALLET_REPOSITORY, WalletRepository } from '../domain/wallet.repository';

@Injectable()
export class GetWalletUseCase {
  constructor(@Inject(WALLET_REPOSITORY) private readonly wallets: WalletRepository) {}

  async execute(id: string): Promise<Wallet> {
    const wallet = await this.wallets.findById(id);
    if (!wallet) {
      throw new NotFoundError('WALLET_NOT_FOUND', `Carteira ${id} não encontrada`);
    }
    return wallet;
  }
}
