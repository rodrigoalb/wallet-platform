import { EventEnvelope, EventTypes, ProcessedEvents } from '@app/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PLAYER_NOTIFIER, PlayerNotifier } from './player-notifier';

/** Nome do evento enviado ao navegador pelo WebSocket. */
export const BALANCE_UPDATED_SOCKET_EVENT = 'balance.updated';

/**
 * Converte eventos da fila em notificações para o jogador dono da carteira.
 * Ignora eventIds já processados, porque o SQS pode entregar a mesma
 * mensagem mais de uma vez.
 */
@Injectable()
export class WalletEventHandler {
  private readonly logger = new Logger(WalletEventHandler.name);
  private readonly processed = new ProcessedEvents();

  constructor(@Inject(PLAYER_NOTIFIER) private readonly notifier: PlayerNotifier) {}

  handle(event: EventEnvelope): Promise<void> {
    if (this.processed.has(event.eventId)) {
      this.logger.log(`Evento ${event.eventId} já processado; ignorado`);
      return Promise.resolve();
    }

    if (event.type === EventTypes.BalanceUpdated) {
      const { playerId, walletId, balanceCents, currency, transactionId } = event.payload;
      this.notifier.notifyPlayer(playerId, BALANCE_UPDATED_SOCKET_EVENT, {
        walletId,
        balance: { amountCents: balanceCents, currency },
        transactionId,
        occurredAt: event.occurredAt,
      });
    } else {
      this.logger.warn(`Tipo de evento não tratado: ${event.type}`);
    }

    this.processed.add(event.eventId);
    return Promise.resolve();
  }
}
