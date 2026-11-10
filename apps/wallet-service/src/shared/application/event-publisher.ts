import { DomainEvent } from '@app/common';

/** Porta de saída para publicar eventos de domínio para outros serviços. */
export interface EventPublisher {
  publish(events: DomainEvent[]): Promise<void>;
}

export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');
