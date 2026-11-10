import { InMemoryPlayerRepository } from '../../testing/in-memory-repositories';
import { ConflictError, InvalidArgumentError } from '../../shared/domain/errors';
import { CreatePlayerUseCase } from './create-player.use-case';

describe('CreatePlayerUseCase', () => {
  let players: InMemoryPlayerRepository;
  let useCase: CreatePlayerUseCase;

  beforeEach(() => {
    players = new InMemoryPlayerRepository();
    useCase = new CreatePlayerUseCase(players);
  });

  it('cria um jogador com e-mail normalizado', async () => {
    const player = await useCase.execute({ name: ' Ana ', email: 'Ana@Example.com ' });

    expect(player.name).toBe('Ana');
    expect(player.email).toBe('ana@example.com');
    expect(players.items.get(player.id)).toBe(player);
  });

  it('recusa e-mail já cadastrado, sem diferenciar maiúsculas', async () => {
    await useCase.execute({ name: 'Ana', email: 'ana@example.com' });

    await expect(useCase.execute({ name: 'Outra Ana', email: 'ANA@example.com' })).rejects.toThrow(
      ConflictError,
    );
  });

  it('recusa nome muito curto', async () => {
    await expect(useCase.execute({ name: ' a ', email: 'a@example.com' })).rejects.toThrow(
      InvalidArgumentError,
    );
  });
});
