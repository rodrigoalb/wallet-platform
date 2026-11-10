import { EventTypes } from '@app/common';
import { BusinessRuleError, NotFoundError } from '../../shared/domain/errors';
import {
  FakeTransactionManager,
  InMemoryTransactionRepository,
  InMemoryWalletRepository,
  RecordingEventPublisher,
} from '../../testing/in-memory-repositories';
import { TransactionType } from '../domain/transaction.entity';
import { Wallet } from '../domain/wallet.entity';
import { RegisterMovementUseCase } from './register-movement.use-case';

describe('RegisterMovementUseCase', () => {
  let wallets: InMemoryWalletRepository;
  let transactions: InMemoryTransactionRepository;
  let publisher: RecordingEventPublisher;
  let useCase: RegisterMovementUseCase;
  let wallet: Wallet;

  const deposit = (amountCents: number, idempotencyKey: string) =>
    useCase.execute({
      walletId: wallet.id,
      type: TransactionType.DEPOSIT,
      amountCents,
      idempotencyKey,
    });

  beforeEach(async () => {
    wallets = new InMemoryWalletRepository();
    transactions = new InMemoryTransactionRepository();
    publisher = new RecordingEventPublisher();
    useCase = new RegisterMovementUseCase(
      wallets,
      transactions,
      new FakeTransactionManager(),
      publisher,
    );
    wallet = new Wallet('player-1');
    await wallets.save(wallet);
  });

  it('registra depósito, grava o lançamento e publica os eventos', async () => {
    const result = await deposit(2500, 'dep-1');

    expect(result.replayed).toBe(false);
    expect(transactions.items).toHaveLength(1);
    expect(wallet.balance.amountCents).toBe(2500);
    expect(publisher.published.map((e) => e.type)).toEqual([
      EventTypes.TransactionCreated,
      EventTypes.BalanceUpdated,
    ]);
  });

  it('repetir a mesma Idempotency-Key devolve o mesmo lançamento sem duplicar', async () => {
    const first = await deposit(2500, 'dep-1');
    const second = await deposit(2500, 'dep-1');

    expect(second.replayed).toBe(true);
    expect(second.transaction.id).toBe(first.transaction.id);
    expect(transactions.items).toHaveLength(1);
    expect(wallet.balance.amountCents).toBe(2500);
    // A repetição não publica eventos de novo.
    expect(publisher.published).toHaveLength(2);
  });

  it('recusa a mesma chave com valor diferente', async () => {
    await deposit(2500, 'dep-1');
    await expect(deposit(9999, 'dep-1')).rejects.toThrow(BusinessRuleError);
  });

  it('saque sem saldo falha e não publica nada', async () => {
    await expect(
      useCase.execute({
        walletId: wallet.id,
        type: TransactionType.WITHDRAWAL,
        amountCents: 100,
        idempotencyKey: 'wd-1',
      }),
    ).rejects.toThrow('Saldo insuficiente');
    expect(transactions.items).toHaveLength(0);
    expect(publisher.published).toHaveLength(0);
  });

  it('falha se a carteira não existe', async () => {
    await expect(
      useCase.execute({
        walletId: 'nao-existe',
        type: TransactionType.DEPOSIT,
        amountCents: 100,
        idempotencyKey: 'k',
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('falha na publicação não desfaz a operação já confirmada', async () => {
    jest.spyOn(publisher, 'publish').mockRejectedValueOnce(new Error('SNS fora do ar'));

    const result = await deposit(1000, 'dep-1');

    expect(result.replayed).toBe(false);
    expect(wallet.balance.amountCents).toBe(1000);
  });
});
