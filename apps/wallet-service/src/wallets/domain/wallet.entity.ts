import { BigIntType, Check, Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { DomainEvent, EventTypes } from '@app/common';
import { randomUUID } from 'node:crypto';
import { Player } from '../../players/domain/player.entity';
import { BusinessRuleError, InvalidArgumentError } from '../../shared/domain/errors';
import { Money } from './money';
import { Transaction, TransactionType } from './transaction.entity';

/**
 * Agregado Carteira: única porta de entrada para alterar saldo.
 * Referencia o jogador apenas pelo id (mapToPk), uma regra comum em DDD:
 * agregados diferentes não carregam um ao outro.
 */
@Entity({ tableName: 'wallets' })
@Check({ name: 'wallets_balance_cents_check', expression: 'balance_cents >= 0' })
export class Wallet {
  @PrimaryKey({ type: 'uuid' })
  readonly id: string = randomUUID();

  @ManyToOne(() => Player, { mapToPk: true, fieldName: 'player_id', unique: true })
  readonly playerId: string;

  /** Saldo em centavos. bigint no banco, number no TypeScript (seguro até 2^53). */
  @Property({ type: new BigIntType('number') })
  private balanceCents: number = 0;

  @Property({ type: 'string', length: 3 })
  readonly currency: string = 'BRL';

  /**
   * Optimistic locking: o MikroORM inclui "WHERE version = ?" no UPDATE e
   * incrementa o valor. Se outra requisição alterou a carteira antes,
   * nenhuma linha é atualizada e um OptimisticLockError é lançado.
   */
  @Property({ type: 'integer', version: true })
  readonly version!: number;

  @Property({ type: 'datetime', columnType: 'timestamptz' })
  readonly createdAt: Date = new Date();

  @Property({ type: 'datetime', columnType: 'timestamptz', defaultRaw: 'now()' })
  updatedAt: Date = new Date();

  /**
   * Eventos gerados e ainda não publicados. Não é persistido. O MikroORM não
   * executa o construtor nem inicializadores ao carregar do banco, por isso a
   * inicialização preguiçosa em recordEvent().
   */
  private pendingEvents?: DomainEvent[];

  constructor(playerId: string) {
    this.playerId = playerId;
  }

  get balance(): Money {
    return Money.of(this.balanceCents, this.currency);
  }

  deposit(amount: Money, idempotencyKey: string): Transaction {
    this.assertPositive(amount);
    return this.applyMovement(
      TransactionType.DEPOSIT,
      amount,
      this.balance.add(amount),
      idempotencyKey,
    );
  }

  withdraw(amount: Money, idempotencyKey: string): Transaction {
    this.assertPositive(amount);
    if (this.balance.isLessThan(amount)) {
      throw new BusinessRuleError(
        'INSUFFICIENT_FUNDS',
        `Saldo insuficiente: saldo ${this.balance.toString()}, saque ${amount.toString()}`,
      );
    }
    return this.applyMovement(
      TransactionType.WITHDRAWAL,
      amount,
      this.balance.subtract(amount),
      idempotencyKey,
    );
  }

  /** Devolve e limpa os eventos pendentes (chamado pelo caso de uso após salvar). */
  pullEvents(): DomainEvent[] {
    const events = this.pendingEvents ?? [];
    this.pendingEvents = [];
    return events;
  }

  private applyMovement(
    type: TransactionType,
    amount: Money,
    newBalance: Money,
    idempotencyKey: string,
  ): Transaction {
    const transaction = new Transaction(this.id, type, amount, newBalance, idempotencyKey);
    this.balanceCents = newBalance.amountCents;
    this.updatedAt = transaction.createdAt;

    this.recordEvent({
      type: EventTypes.TransactionCreated,
      payload: {
        transactionId: transaction.id,
        walletId: this.id,
        playerId: this.playerId,
        type,
        amountCents: transaction.amountCents,
        balanceAfterCents: transaction.balanceAfterCents,
        currency: this.currency,
        createdAt: transaction.createdAt.toISOString(),
      },
    });
    this.recordEvent({
      type: EventTypes.BalanceUpdated,
      payload: {
        walletId: this.id,
        playerId: this.playerId,
        balanceCents: this.balanceCents,
        currency: this.currency,
        transactionId: transaction.id,
      },
    });
    return transaction;
  }

  private assertPositive(amount: Money): void {
    if (amount.isZero()) {
      throw new InvalidArgumentError('INVALID_AMOUNT', 'O valor deve ser maior que zero');
    }
  }

  private recordEvent(event: DomainEvent): void {
    (this.pendingEvents ??= []).push(event);
  }
}
