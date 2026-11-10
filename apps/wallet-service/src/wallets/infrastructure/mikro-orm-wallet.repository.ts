import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { Wallet } from '../domain/wallet.entity';
import { WalletRepository } from '../domain/wallet.repository';

@Injectable()
export class MikroOrmWalletRepository implements WalletRepository {
  constructor(private readonly em: EntityManager) {}

  findById(id: string): Promise<Wallet | null> {
    return this.em.findOne(Wallet, { id });
  }

  findByPlayerId(playerId: string): Promise<Wallet | null> {
    return this.em.findOne(Wallet, { playerId });
  }

  async save(wallet: Wallet): Promise<void> {
    await this.em.persist(wallet).flush();
  }
}
