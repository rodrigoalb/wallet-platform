import { Module } from '@nestjs/common';
import { PlayersModule } from '../players/players.module';
import { CreateWalletUseCase } from './application/create-wallet.use-case';
import { GetWalletUseCase } from './application/get-wallet.use-case';
import { WALLET_REPOSITORY } from './domain/wallet.repository';
import { MikroOrmWalletRepository } from './infrastructure/mikro-orm-wallet.repository';
import { WalletsController } from './presentation/wallets.controller';

@Module({
  imports: [PlayersModule],
  controllers: [WalletsController],
  providers: [
    CreateWalletUseCase,
    GetWalletUseCase,
    { provide: WALLET_REPOSITORY, useClass: MikroOrmWalletRepository },
  ],
})
export class WalletsModule {}
