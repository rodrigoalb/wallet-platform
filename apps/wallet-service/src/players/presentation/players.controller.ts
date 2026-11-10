import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationQuery } from '../../shared/http/pagination.query';
import { CreatePlayerUseCase } from '../application/create-player.use-case';
import { GetPlayerUseCase } from '../application/get-player.use-case';
import { ListPlayersUseCase } from '../application/list-players.use-case';
import { CreatePlayerDto } from './dto/create-player.dto';
import { PlayerPageResponse } from './dto/player-page.response';
import { PlayerResponse } from './dto/player.response';

@ApiTags('players')
@Controller('players')
export class PlayersController {
  constructor(
    private readonly createPlayer: CreatePlayerUseCase,
    private readonly getPlayer: GetPlayerUseCase,
    private readonly listPlayers: ListPlayersUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreatePlayerDto): Promise<PlayerResponse> {
    return PlayerResponse.from(await this.createPlayer.execute(dto));
  }

  /** Lista os jogadores, mais recentes primeiro. */
  @Get()
  async list(@Query() query: PaginationQuery): Promise<PlayerPageResponse> {
    const page = await this.listPlayers.execute({ page: query.page, limit: query.limit });
    return {
      items: page.items.map((p) => PlayerResponse.from(p)),
      page: query.page,
      limit: query.limit,
      total: page.total,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PlayerResponse> {
    return PlayerResponse.from(await this.getPlayer.execute(id));
  }
}
