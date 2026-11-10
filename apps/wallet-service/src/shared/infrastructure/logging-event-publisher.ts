import { DomainEvent } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { EventPublisher } from '../application/event-publisher';

/** Publicador provisório que apenas registra os eventos no log. */
@Injectable()
export class LoggingEventPublisher implements EventPublisher {
  private readonly logger = new Logger(LoggingEventPublisher.name);

  publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      this.logger.log(`Evento ${event.type}: ${JSON.stringify(event.payload)}`);
    }
    return Promise.resolve();
  }
}
