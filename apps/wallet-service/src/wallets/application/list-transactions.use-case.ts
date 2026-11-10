import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../shared/domain/errors';
import { Transaction } from '../domain/transaction.entity';
import {
  Page,
  TRANSACTION_REPOSITORY,
  TransactionFilter,
  TransactionRepository,
} from '../domain/transaction.repository';
import { WALLET_REPOSITORY, WalletRepository } from '../domain/wallet.repository';

@Injectable()
export class ListTransactionsUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY) private readonly wallets: WalletRepository,
    @Inject(TRANSACTION_REPOSITORY) private readonly transactions: TransactionRepository,
  ) {}

  async execute(filter: TransactionFilter): Promise<Page<Transaction>> {
    if (!(await this.wallets.findById(filter.walletId))) {
      throw new NotFoundError('WALLET_NOT_FOUND', `Carteira ${filter.walletId} não encontrada`);
    }
    return this.transactions.findPage(filter);
  }
}
