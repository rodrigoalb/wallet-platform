import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { PlayersModule } from './players/players.module';
import { WalletsModule } from './wallets/wallets.module';

@Module({
  imports: [ConfigModule, DatabaseModule, PlayersModule, WalletsModule],
  controllers: [HealthController],
})
export class AppModule {}
