import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../shared/domain/errors';
import { Player } from '../domain/player.entity';
import { PLAYER_REPOSITORY, PlayerRepository } from '../domain/player.repository';

@Injectable()
export class GetPlayerUseCase {
  constructor(@Inject(PLAYER_REPOSITORY) private readonly players: PlayerRepository) {}

  async execute(id: string): Promise<Player> {
    const player = await this.players.findById(id);
    if (!player) {
      throw new NotFoundError('PLAYER_NOT_FOUND', `Jogador ${id} não encontrado`);
    }
    return player;
  }
}
