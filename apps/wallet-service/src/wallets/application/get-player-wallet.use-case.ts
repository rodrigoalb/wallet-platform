import { Inject, Injectable } from '@nestjs/common';
import { PLAYER_REPOSITORY, PlayerRepository } from '../../players/domain/player.repository';
import { NotFoundError } from '../../shared/domain/errors';
import { Wallet } from '../domain/wallet.entity';
import { WALLET_REPOSITORY, WalletRepository } from '../domain/wallet.repository';

/** Encontra a carteira a partir do jogador (útil quando o cliente só conhece o playerId). */
@Injectable()
export class GetPlayerWalletUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly players: PlayerRepository,
    @Inject(WALLET_REPOSITORY) private readonly wallets: WalletRepository,
  ) {}

  async execute(playerId: string): Promise<Wallet> {
    // Separa os dois casos de 404 para a mensagem dizer o que realmente falta.
    if (!(await this.players.findById(playerId))) {
      throw new NotFoundError('PLAYER_NOT_FOUND', `Jogador ${playerId} não encontrado`);
    }
    const wallet = await this.wallets.findByPlayerId(playerId);
    if (!wallet) {
      throw new NotFoundError(
        'WALLET_NOT_FOUND',
        `O jogador ${playerId} ainda não tem carteira. Crie com POST /players/${playerId}/wallet`,
      );
    }
    return wallet;
  }
}
