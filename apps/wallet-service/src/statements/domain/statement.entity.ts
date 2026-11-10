import { statementObjectKey } from '@app/common';
import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';
import { InvalidArgumentError } from '../../shared/domain/errors';
import { Wallet } from '../../wallets/domain/wallet.entity';

export enum StatementStatus {
  PENDING = 'PENDING',
  READY = 'READY',
}

const MAX_PERIOD_DAYS = 366;

/**
 * Pedido de extrato. O arquivo é gerado de forma assíncrona pelo
 * statement-worker; aqui guardamos o período pedido e onde o CSV ficará no S3.
 */
@Entity({ tableName: 'statements' })
export class Statement {
  @PrimaryKey({ type: 'uuid' })
  readonly id: string = randomUUID();

  @ManyToOne(() => Wallet, { mapToPk: true, fieldName: 'wallet_id' })
  readonly walletId: string;

  @Property({ type: 'datetime', columnType: 'timestamptz' })
  readonly periodFrom: Date;

  @Property({ type: 'datetime', columnType: 'timestamptz' })
  readonly periodTo: Date;

  @Enum({ items: () => StatementStatus })
  status: StatementStatus = StatementStatus.PENDING;

  /** Chave do objeto no bucket. Definida na criação para o worker e a API concordarem. */
  @Property({ type: 'string', length: 255 })
  readonly objectKey: string;

  @Property({ type: 'datetime', columnType: 'timestamptz' })
  readonly createdAt: Date = new Date();

  @Property({ type: 'datetime', columnType: 'timestamptz', nullable: true })
  readyAt?: Date;

  constructor(walletId: string, periodFrom: Date, periodTo: Date) {
    if (periodFrom.getTime() > periodTo.getTime()) {
      throw new InvalidArgumentError('INVALID_PERIOD', 'A data inicial deve ser anterior à final');
    }
    const days = (periodTo.getTime() - periodFrom.getTime()) / 86_400_000;
    if (days > MAX_PERIOD_DAYS) {
      throw new InvalidArgumentError(
        'INVALID_PERIOD',
        `O período máximo de um extrato é de ${MAX_PERIOD_DAYS} dias`,
      );
    }
    this.walletId = walletId;
    this.periodFrom = periodFrom;
    this.periodTo = periodTo;
    this.objectKey = statementObjectKey(walletId, this.id);
  }

  markReady(): void {
    if (this.status === StatementStatus.READY) return;
    this.status = StatementStatus.READY;
    this.readyAt = new Date();
  }
}
