import { EventEnvelope } from '@app/common';
import { PlayerNotifier } from './player-notifier';
import { WalletEventHandler } from './wallet-event.handler';

const balanceUpdated = (eventId: string): EventEnvelope => ({
  eventId,
  correlationId: 'c1',
  occurredAt: '2026-01-01T00:00:00.000Z',
  type: 'wallet.balance-updated',
  payload: {
    walletId: 'w1',
    playerId: 'p1',
    balanceCents: 4200,
    currency: 'BRL',
    transactionId: 't1',
  },
});

describe('WalletEventHandler', () => {
  let notifier: jest.Mocked<PlayerNotifier>;
  let handler: WalletEventHandler;

  beforeEach(() => {
    notifier = { notifyPlayer: jest.fn() };
    handler = new WalletEventHandler(notifier);
  });

  it('notifica o jogador dono da carteira', async () => {
    await handler.handle(balanceUpdated('e1'));

    expect(notifier.notifyPlayer).toHaveBeenCalledWith('p1', 'balance.updated', {
      walletId: 'w1',
      balance: { amountCents: 4200, currency: 'BRL' },
      transactionId: 't1',
      occurredAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('ignora entrega duplicada do mesmo evento', async () => {
    await handler.handle(balanceUpdated('e1'));
    await handler.handle(balanceUpdated('e1'));
    await handler.handle(balanceUpdated('e2'));

    expect(notifier.notifyPlayer).toHaveBeenCalledTimes(2);
  });
});
