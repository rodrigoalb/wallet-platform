import { EventEnvelope, EventTypes, runWithCorrelationId } from '@app/common';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { loadWalletConfig } from '../../config/wallet-config';
import { SnsEventPublisher } from './sns-event-publisher';

describe('SnsEventPublisher', () => {
  it('envia o envelope com eventId, correlationId e o atributo usado pelos filtros', async () => {
    const send = jest.fn().mockResolvedValue({});
    const publisher = new SnsEventPublisher(
      { send } as unknown as SNSClient,
      await loadWalletConfig(),
    );

    await runWithCorrelationId('req-42', () =>
      publisher.publish([
        {
          type: EventTypes.BalanceUpdated,
          payload: {
            walletId: 'w1',
            playerId: 'p1',
            balanceCents: 100,
            currency: 'BRL',
            transactionId: 't1',
          },
        },
      ]),
    );

    const command = send.mock.calls[0][0] as PublishCommand;
    const envelope = JSON.parse(command.input.Message!) as EventEnvelope;
    expect(envelope).toMatchObject({ type: 'wallet.balance-updated', correlationId: 'req-42' });
    expect(envelope.eventId).toMatch(/^[0-9a-f-]{36}$/);
    expect(command.input.MessageAttributes).toEqual({
      eventType: { DataType: 'String', StringValue: 'wallet.balance-updated' },
    });
  });
});
