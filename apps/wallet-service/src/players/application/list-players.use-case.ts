import { Inject, Injectable } from '@nestjs/common';
import { Page, PageRequest } from '../../shared/domain/page';
import { Player } from '../domain/player.entity';
import { PLAYER_REPOSITORY, PlayerRepository } from '../domain/player.repository';

@Injectable()
export class ListPlayersUseCase {
  constructor(@Inject(PLAYER_REPOSITORY) private readonly players: PlayerRepository) {}

  execute(request: PageRequest): Promise<Page<Player>> {
    return this.players.findPage(request);
  }
}
