import { Inject, Injectable } from '@nestjs/common';
import { ConflictError } from '../../shared/domain/errors';
import { Player } from '../domain/player.entity';
import { PLAYER_REPOSITORY, PlayerRepository } from '../domain/player.repository';

export interface CreatePlayerCommand {
  name: string;
  email: string;
}

@Injectable()
export class CreatePlayerUseCase {
  constructor(@Inject(PLAYER_REPOSITORY) private readonly players: PlayerRepository) {}

  async execute(command: CreatePlayerCommand): Promise<Player> {
    // A constraint UNIQUE no banco é a garantia final; esta verificação
    // existe para devolver uma mensagem clara no caso comum.
    if (await this.players.findByEmail(command.email)) {
      throw new ConflictError('EMAIL_ALREADY_IN_USE', 'Já existe um jogador com este e-mail');
    }
    const player = new Player(command.name, command.email);
    await this.players.save(player);
    return player;
  }
}
