import { OptimisticLockError, UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { TransactionManager } from '../application/transaction-manager';
import { ConcurrencyConflictError } from '../domain/errors';

/**
 * em.transactional() abre a transação e registra o EntityManager transacional
 * no contexto assíncrono atual. Por isso os repositórios, que recebem o
 * EntityManager por injeção, passam a usar a transação automaticamente
 * (parecido com o @Transactional do Spring).
 */
@Injectable()
export class MikroOrmTransactionManager implements TransactionManager {
  constructor(private readonly em: EntityManager) {}

  async run<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await this.em.transactional(() => work());
    } catch (error) {
      // Traduz erros do ORM para um erro da aplicação, para que os casos de uso
      // não dependam do MikroORM.
      if (
        error instanceof OptimisticLockError ||
        error instanceof UniqueConstraintViolationException
      ) {
        throw new ConcurrencyConflictError();
      }
      throw error;
    }
  }
}
