import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { Page, PageRequest } from '../../shared/domain/page';
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

  async findPage({ page, limit }: PageRequest): Promise<Page<Player>> {
    // O id desempata jogadores criados no mesmo instante, deixando a ordem estável entre páginas.
    const [items, total] = await this.em.findAndCount(
      Player,
      {},
      { orderBy: { createdAt: 'desc', id: 'desc' }, limit, offset: (page - 1) * limit },
    );
    return { items, total };
  }

  async save(player: Player): Promise<void> {
    await this.em.persist(player).flush();
  }
}
