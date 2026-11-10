import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';
import { InvalidArgumentError } from '../../shared/domain/errors';

/**
 * Jogador. Os decorators do MikroORM ficam na própria classe de domínio
 * (como @Entity do JPA): é uma escolha pragmática, explicada em docs/adr/0001.
 * O MikroORM não chama o construtor ao carregar do banco, então as validações
 * do construtor valem apenas para objetos novos.
 */
@Entity({ tableName: 'players' })
export class Player {
  @PrimaryKey({ type: 'uuid' })
  readonly id: string = randomUUID();

  @Property({ type: 'string', length: 120 })
  readonly name: string;

  @Property({ type: 'string', length: 254, unique: true })
  readonly email: string;

  @Property({ type: 'datetime', columnType: 'timestamptz' })
  readonly createdAt: Date = new Date();

  constructor(name: string, email: string) {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      throw new InvalidArgumentError('INVALID_NAME', 'O nome deve ter pelo menos 2 caracteres');
    }
    this.name = trimmedName;
    this.email = Player.normalizeEmail(email);
  }

  /** E-mails são comparados sem diferenciar maiúsculas para garantir a unicidade. */
  static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
