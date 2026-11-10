import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { Player } from '../domain/player.entity';
import { PlayerRepository } from '../domain/player.repository';

@Injectable()
export class MikroOrmPlayerRepository implements PlayerRepository {
  constructor(private readonly em: EntityManager) {}

  findById(id: string): Promise<Player | null> {
    return this.em.findOne(Player, { id });
  }

  findByEmail(email: string): Promise<Player | null> {
    return this.em.findOne(Player, { email: Player.normalizeEmail(email) });
  }

  async save(player: Player): Promise<void> {
    await this.em.persist(player).flush();
  }
}
