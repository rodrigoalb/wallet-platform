import { Module } from '@nestjs/common';
import { PlayersModule } from '../players/players.module';
import { CreateWalletUseCase } from './application/create-wallet.use-case';
import { GetPlayerWalletUseCase } from './application/get-player-wallet.use-case';
import { GetWalletUseCase } from './application/get-wallet.use-case';
import { ListTransactionsUseCase } from './application/list-transactions.use-case';
import { RegisterMovementUseCase } from './application/register-movement.use-case';
import { TRANSACTION_REPOSITORY } from './domain/transaction.repository';
import { WALLET_REPOSITORY } from './domain/wallet.repository';
import { MikroOrmTransactionRepository } from './infrastructure/mikro-orm-transaction.repository';
import { MikroOrmWalletRepository } from './infrastructure/mikro-orm-wallet.repository';
import { WalletsController } from './presentation/wallets.controller';

@Module({
  imports: [PlayersModule],
  controllers: [WalletsController],
  providers: [
    CreateWalletUseCase,
    GetWalletUseCase,
    GetPlayerWalletUseCase,
    RegisterMovementUseCase,
    ListTransactionsUseCase,
    { provide: WALLET_REPOSITORY, useClass: MikroOrmWalletRepository },
    { provide: TRANSACTION_REPOSITORY, useClass: MikroOrmTransactionRepository },
  ],
  exports: [WALLET_REPOSITORY, TRANSACTION_REPOSITORY],
})
export class WalletsModule {}
