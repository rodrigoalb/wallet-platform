import { Global, Module } from '@nestjs/common';
import { EVENT_PUBLISHER } from './application/event-publisher';
import { TRANSACTION_MANAGER } from './application/transaction-manager';
import { awsProviders } from './infrastructure/aws.providers';
import { MikroOrmTransactionManager } from './infrastructure/mikro-orm-transaction-manager';
import { SnsEventPublisher } from './infrastructure/sns-event-publisher';

@Global()
@Module({
  providers: [
    ...awsProviders,
    { provide: TRANSACTION_MANAGER, useClass: MikroOrmTransactionManager },
    { provide: EVENT_PUBLISHER, useClass: SnsEventPublisher },
  ],
  exports: [...awsProviders, TRANSACTION_MANAGER, EVENT_PUBLISHER],
})
export class SharedModule {}
