import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { PlayersModule } from './players/players.module';
import { SharedModule } from './shared/shared.module';
import { StatementsModule } from './statements/statements.module';
import { WalletsModule } from './wallets/wallets.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    SharedModule,
    PlayersModule,
    WalletsModule,
    StatementsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
