import { FilterQuery } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { Transaction } from '../domain/transaction.entity';
import { Page } from '../../shared/domain/page';
import { TransactionFilter, TransactionRepository } from '../domain/transaction.repository';

@Injectable()
export class MikroOrmTransactionRepository implements TransactionRepository {
  constructor(private readonly em: EntityManager) {}

  findByIdempotencyKey(walletId: string, idempotencyKey: string): Promise<Transaction | null> {
    return this.em.findOne(Transaction, { walletId, idempotencyKey });
  }

  async findPage(filter: TransactionFilter): Promise<Page<Transaction>> {
    const where: FilterQuery<Transaction> = { walletId: filter.walletId };
    if (filter.type) where.type = filter.type;
    if (filter.from || filter.to) {
      where.createdAt = {
        ...(filter.from && { $gte: filter.from }),
        ...(filter.to && { $lte: filter.to }),
      };
    }
    // Usa o índice (wallet_id, created_at) criado na segunda migração.
    const [items, total] = await this.em.findAndCount(Transaction, where, {
      orderBy: { createdAt: 'desc', id: 'desc' },
      limit: filter.limit,
      offset: (filter.page - 1) * filter.limit,
    });
    return { items, total };
  }

  async add(transaction: Transaction): Promise<void> {
    await this.em.persist(transaction).flush();
  }
}
