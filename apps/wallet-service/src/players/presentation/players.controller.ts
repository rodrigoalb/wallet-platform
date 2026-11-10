import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreatePlayerUseCase } from '../application/create-player.use-case';
import { GetPlayerUseCase } from '../application/get-player.use-case';
import { CreatePlayerDto } from './dto/create-player.dto';
import { PlayerResponse } from './dto/player.response';

@ApiTags('players')
@Controller('players')
export class PlayersController {
  constructor(
    private readonly createPlayer: CreatePlayerUseCase,
    private readonly getPlayer: GetPlayerUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreatePlayerDto): Promise<PlayerResponse> {
    return PlayerResponse.from(await this.createPlayer.execute(dto));
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PlayerResponse> {
    return PlayerResponse.from(await this.getPlayer.execute(id));
  }
}
