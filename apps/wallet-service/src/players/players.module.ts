import { Module } from '@nestjs/common';
import { CreatePlayerUseCase } from './application/create-player.use-case';
import { GetPlayerUseCase } from './application/get-player.use-case';
import { ListPlayersUseCase } from './application/list-players.use-case';
import { PLAYER_REPOSITORY } from './domain/player.repository';
import { MikroOrmPlayerRepository } from './infrastructure/mikro-orm-player.repository';
import { PlayersController } from './presentation/players.controller';

@Module({
  controllers: [PlayersController],
  providers: [
    CreatePlayerUseCase,
    GetPlayerUseCase,
    ListPlayersUseCase,
    // Liga a porta (interface) à implementação concreta, como um @Bean no Spring.
    { provide: PLAYER_REPOSITORY, useClass: MikroOrmPlayerRepository },
  ],
  exports: [PLAYER_REPOSITORY],
})
export class PlayersModule {}
