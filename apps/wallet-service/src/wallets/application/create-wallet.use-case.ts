import { Inject, Injectable } from '@nestjs/common';
import { PLAYER_REPOSITORY, PlayerRepository } from '../../players/domain/player.repository';
import { ConflictError, NotFoundError } from '../../shared/domain/errors';
import { Wallet } from '../domain/wallet.entity';
import { WALLET_REPOSITORY, WalletRepository } from '../domain/wallet.repository';

@Injectable()
export class CreateWalletUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly players: PlayerRepository,
    @Inject(WALLET_REPOSITORY) private readonly wallets: WalletRepository,
  ) {}

  async execute(playerId: string): Promise<Wallet> {
    if (!(await this.players.findById(playerId))) {
      throw new NotFoundError('PLAYER_NOT_FOUND', `Jogador ${playerId} não encontrado`);
    }
    if (await this.wallets.findByPlayerId(playerId)) {
      throw new ConflictError('WALLET_ALREADY_EXISTS', 'Este jogador já possui uma carteira');
    }
    const wallet = new Wallet(playerId);
    await this.wallets.save(wallet);
    return wallet;
  }
}
