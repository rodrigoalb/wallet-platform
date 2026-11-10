import {
  BigIntType,
  Check,
  Entity,
  Enum,
  Index,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';
import { Money } from './money';
import { Wallet } from './wallet.entity';

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
}

/**
 * Lançamento do ledger. É imutável: todas as propriedades são readonly e o
 * banco tem um trigger que bloqueia UPDATE e DELETE nesta tabela.
 * O saldo da carteira é sempre a soma dos lançamentos; guardar balanceAfter
 * em cada linha facilita auditoria e extratos.
 */
@Entity({ tableName: 'transactions' })
@Unique({
  name: 'transactions_wallet_id_idempotency_key_unique',
  properties: ['walletId', 'idempotencyKey'],
})
@Check({ name: 'transactions_amount_cents_check', expression: 'amount_cents > 0' })
@Check({ name: 'transactions_balance_after_cents_check', expression: 'balance_after_cents >= 0' })
@Index({ name: 'transactions_wallet_id_created_at_index', properties: ['walletId', 'createdAt'] })
export class Transaction {
  @PrimaryKey({ type: 'uuid' })
  readonly id: string = randomUUID();

  @ManyToOne(() => Wallet, { mapToPk: true, fieldName: 'wallet_id' })
  readonly walletId: string;

  @Enum({ items: () => TransactionType })
  readonly type: TransactionType;

  @Property({ type: new BigIntType('number') })
  readonly amountCents: number;

  @Property({ type: new BigIntType('number') })
  readonly balanceAfterCents: number;

  @Property({ type: 'string', length: 3 })
  readonly currency: string;

  @Property({ type: 'string', length: 100 })
  readonly idempotencyKey: string;

  @Property({ type: 'datetime', columnType: 'timestamptz' })
  readonly createdAt: Date = new Date();

  /** Use Wallet.deposit()/withdraw(): só o agregado cria lançamentos. */
  constructor(
    walletId: string,
    type: TransactionType,
    amount: Money,
    balanceAfter: Money,
    idempotencyKey: string,
  ) {
    this.walletId = walletId;
    this.type = type;
    this.amountCents = amount.amountCents;
    this.balanceAfterCents = balanceAfter.amountCents;
    this.currency = amount.currency;
    this.idempotencyKey = idempotencyKey;
  }

  get amount(): Money {
    return Money.of(this.amountCents, this.currency);
  }
}
