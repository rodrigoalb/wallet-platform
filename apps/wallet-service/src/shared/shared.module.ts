import { Global, Module } from '@nestjs/common';
import { EVENT_PUBLISHER } from './application/event-publisher';
import { TRANSACTION_MANAGER } from './application/transaction-manager';
import { LoggingEventPublisher } from './infrastructure/logging-event-publisher';
import { MikroOrmTransactionManager } from './infrastructure/mikro-orm-transaction-manager';

@Global()
@Module({
  providers: [
    { provide: TRANSACTION_MANAGER, useClass: MikroOrmTransactionManager },
    { provide: EVENT_PUBLISHER, useClass: LoggingEventPublisher },
  ],
  exports: [TRANSACTION_MANAGER, EVENT_PUBLISHER],
})
export class SharedModule {}
