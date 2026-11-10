import { BigIntType, Check, Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';
import { Player } from '../../players/domain/player.entity';

/**
 * Agregado Carteira. Referencia o jogador apenas pelo id (mapToPk), uma regra
 * comum em DDD: agregados diferentes não carregam um ao outro.
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

  constructor(playerId: string) {
    this.playerId = playerId;
  }

  get balanceInCents(): number {
    return this.balanceCents;
  }
}
