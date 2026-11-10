import { Player } from '../players/domain/player.entity';
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
