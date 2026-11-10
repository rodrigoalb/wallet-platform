import { Player } from '../../players/domain/player.entity';
import { ConflictError, NotFoundError } from '../../shared/domain/errors';
import {
  InMemoryPlayerRepository,
  InMemoryWalletRepository,
} from '../../testing/in-memory-repositories';
import { CreateWalletUseCase } from './create-wallet.use-case';

describe('CreateWalletUseCase', () => {
  let players: InMemoryPlayerRepository;
  let wallets: InMemoryWalletRepository;
  let useCase: CreateWalletUseCase;
  let player: Player;

  beforeEach(async () => {
    players = new InMemoryPlayerRepository();
    wallets = new InMemoryWalletRepository();
    useCase = new CreateWalletUseCase(players, wallets);
    player = new Player('Ana', 'ana@example.com');
    await players.save(player);
  });

  it('cria carteira em BRL com saldo zero', async () => {
    const wallet = await useCase.execute(player.id);

    expect(wallet.playerId).toBe(player.id);
    expect(wallet.balance.amountCents).toBe(0);
    expect(wallet.currency).toBe('BRL');
  });

  it('falha se o jogador não existe', async () => {
    await expect(useCase.execute('00000000-0000-0000-0000-000000000000')).rejects.toThrow(
      NotFoundError,
    );
  });

  it('permite apenas uma carteira por jogador', async () => {
    await useCase.execute(player.id);
    await expect(useCase.execute(player.id)).rejects.toThrow(ConflictError);
  });
});
