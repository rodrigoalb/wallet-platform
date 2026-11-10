import { DomainEvent } from '@app/common';
import { EventPublisher } from '../shared/application/event-publisher';
import { TransactionManager } from '../shared/application/transaction-manager';
import { Transaction } from '../wallets/domain/transaction.entity';
import {
  Page,
  TransactionFilter,
  TransactionRepository,
} from '../wallets/domain/transaction.repository';
import { Player } from '../players/domain/player.entity';
import { StatementStorage } from '../statements/application/statement-storage';
import { PlayerRepository } from '../players/domain/player.repository';
import { Wallet } from '../wallets/domain/wallet.entity';
import { WalletRepository } from '../wallets/domain/wallet.repository';

/**
 * Implementações em memória das portas de persistência, usadas nos testes
 * unitários dos casos de uso (sem banco, sem Nest).
 */
export class InMemoryPlayerRepository implements PlayerRepository {
  readonly items = new Map<string, Player>();

  findById(id: string): Promise<Player | null> {
    return Promise.resolve(this.items.get(id) ?? null);
  }

  findByEmail(email: string): Promise<Player | null> {
    const normalized = Player.normalizeEmail(email);
    return Promise.resolve([...this.items.values()].find((p) => p.email === normalized) ?? null);
  }

  save(player: Player): Promise<void> {
    this.items.set(player.id, player);
    return Promise.resolve();
  }
}

export class InMemoryWalletRepository implements WalletRepository {
  readonly items = new Map<string, Wallet>();

  findById(id: string): Promise<Wallet | null> {
    return Promise.resolve(this.items.get(id) ?? null);
  }

  findByPlayerId(playerId: string): Promise<Wallet | null> {
    return Promise.resolve([...this.items.values()].find((w) => w.playerId === playerId) ?? null);
  }

  save(wallet: Wallet): Promise<void> {
    this.items.set(wallet.id, wallet);
    return Promise.resolve();
  }
}

export class InMemoryTransactionRepository implements TransactionRepository {
  readonly items: Transaction[] = [];

  findByIdempotencyKey(walletId: string, key: string): Promise<Transaction | null> {
    return Promise.resolve(
      this.items.find((t) => t.walletId === walletId && t.idempotencyKey === key) ?? null,
    );
  }

  findPage(filter: TransactionFilter): Promise<Page<Transaction>> {
    const matching = this.items.filter(
      (t) => t.walletId === filter.walletId && (!filter.type || t.type === filter.type),
    );
    const start = (filter.page - 1) * filter.limit;
    return Promise.resolve({
      items: matching.slice(start, start + filter.limit),
      total: matching.length,
    });
  }

  add(transaction: Transaction): Promise<void> {
    this.items.push(transaction);
    return Promise.resolve();
  }
}

/** Executa o trabalho diretamente; os testes de transação real ficam no e2e. */
export class FakeTransactionManager implements TransactionManager {
  run<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}

export class RecordingEventPublisher implements EventPublisher {
  readonly published: DomainEvent[] = [];

  publish(events: DomainEvent[]): Promise<void> {
    this.published.push(...events);
    return Promise.resolve();
  }
}

export class InMemoryStatementStorage implements StatementStorage {
  readonly objects = new Set<string>();

  exists(objectKey: string): Promise<boolean> {
    return Promise.resolve(this.objects.has(objectKey));
  }

  createDownloadUrl(objectKey: string, ttlSeconds: number): Promise<string> {
    return Promise.resolve(`https://s3.example/${objectKey}?expires=${ttlSeconds}`);
  }
}
