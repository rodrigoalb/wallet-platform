import { Transaction, TransactionType } from './transaction.entity';

export interface TransactionFilter {
  walletId: string;
  type?: TransactionType;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}

export interface Page<T> {
  items: T[];
  total: number;
}

/** O ledger só aceita inserções: não existe update nem delete nesta porta. */
export interface TransactionRepository {
  findByIdempotencyKey(walletId: string, idempotencyKey: string): Promise<Transaction | null>;
  findPage(filter: TransactionFilter): Promise<Page<Transaction>>;
  add(transaction: Transaction): Promise<void>;
}

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');
