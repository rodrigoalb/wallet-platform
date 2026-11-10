import { DomainEvent, EventEnvelope, getCorrelationId } from '@app/common';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { WALLET_CONFIG, WalletServiceConfig } from '../../config/wallet-config';
import { EventPublisher } from '../application/event-publisher';

/**
 * Publica cada evento no tópico SNS wallet-events. O SNS copia a mensagem para
 * todas as filas assinantes; o atributo eventType é o que os filtros das
 * assinaturas usam para decidir qual fila recebe o quê.
 */
@Injectable()
export class SnsEventPublisher implements EventPublisher {
  private readonly logger = new Logger(SnsEventPublisher.name);

  constructor(
    private readonly sns: SNSClient,
    @Inject(WALLET_CONFIG) private readonly config: WalletServiceConfig,
  ) {}

  async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      const envelope: EventEnvelope = {
        ...event,
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        correlationId: getCorrelationId() ?? randomUUID(),
      };
      await this.sns.send(
        new PublishCommand({
          TopicArn: this.config.eventsTopicArn,
          Message: JSON.stringify(envelope),
          MessageAttributes: {
            eventType: { DataType: 'String', StringValue: envelope.type },
          },
        }),
      );
      this.logger.log(`Evento publicado: ${envelope.type} (${envelope.eventId})`);
    }
  }
}
