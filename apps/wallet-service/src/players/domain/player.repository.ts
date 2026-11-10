import { Page, PageRequest } from '../../shared/domain/page';
import { Player } from './player.entity';

/**
 * Porta de persistência de jogadores. A camada de aplicação depende desta
 * interface, e não do MikroORM, o que permite testar casos de uso com fakes.
 */
export interface PlayerRepository {
  findById(id: string): Promise<Player | null>;
  findByEmail(email: string): Promise<Player | null>;
  /** Mais recentes primeiro. */
  findPage(request: PageRequest): Promise<Page<Player>>;
  save(player: Player): Promise<void>;
}

/** Interfaces somem em tempo de execução, então o Nest injeta por este token. */
export const PLAYER_REPOSITORY = Symbol('PLAYER_REPOSITORY');
