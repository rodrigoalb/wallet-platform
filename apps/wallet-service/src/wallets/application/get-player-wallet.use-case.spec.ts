import { Player } from '../../players/domain/player.entity';
import { NotFoundError } from '../../shared/domain/errors';
import {
  InMemoryPlayerRepository,
  InMemoryWalletRepository,
} from '../../testing/in-memory-repositories';
import { Wallet } from '../domain/wallet.entity';
import { GetPlayerWalletUseCase } from './get-player-wallet.use-case';

describe('GetPlayerWalletUseCase', () => {
  let players: InMemoryPlayerRepository;
  let wallets: InMemoryWalletRepository;
  let useCase: GetPlayerWalletUseCase;
  let player: Player;

  beforeEach(async () => {
    players = new InMemoryPlayerRepository();
    wallets = new InMemoryWalletRepository();
    useCase = new GetPlayerWalletUseCase(players, wallets);
    player = new Player('Ana', 'ana@example.com');
    await players.save(player);
  });

  it('devolve a carteira do jogador', async () => {
    const wallet = new Wallet(player.id);
    await wallets.save(wallet);

    await expect(useCase.execute(player.id)).resolves.toBe(wallet);
  });

  it('distingue jogador inexistente de jogador sem carteira', async () => {
    await expect(useCase.execute('nao-existe')).rejects.toMatchObject({
      code: 'PLAYER_NOT_FOUND',
    });
    await expect(useCase.execute(player.id)).rejects.toThrow(NotFoundError);
    await expect(useCase.execute(player.id)).rejects.toMatchObject({ code: 'WALLET_NOT_FOUND' });
  });
});
