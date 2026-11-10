import { Page, PageRequest } from '../../shared/domain/page';
import { Transaction, TransactionType } from './transaction.entity';

export interface TransactionFilter extends PageRequest {
  walletId: string;
  type?: TransactionType;
  from?: Date;
  to?: Date;
}

/** O ledger só aceita inserções: não existe update nem delete nesta porta. */
export interface TransactionRepository {
  findByIdempotencyKey(walletId: string, idempotencyKey: string): Promise<Transaction | null>;
  findPage(filter: TransactionFilter): Promise<Page<Transaction>>;
  add(transaction: Transaction): Promise<void>;
}

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');
